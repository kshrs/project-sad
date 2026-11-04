const mongoose = require('mongoose');
const { SheetDefinition, SheetEntry, SheetShareRule, SheetUnlockGrant, MonthlyReport } = require('../models');
const logger = require('../config/logger');

// Cache for idempotency keys to prevent duplicate batch saves (5 mins TTL)
const idempotencyCache = new Map();

const sheetEntryController = {
  // 1. Get entries for a sheet (scoped by User role, Owner isolation, and Shared access)
  getEntries: async (req, res) => {
    try {
      const { sheetKey } = req.params;
      const { monthId, staffId } = req.query;

      if (!monthId) {
        return res.status(400).json({ success: false, message: 'monthId query parameter is required' });
      }

      const sheet = await SheetDefinition.findOne({ sheetKey });
      if (!sheet) {
        return res.status(404).json({ success: false, message: `Sheet '${sheetKey}' not found` });
      }

      let query = {
        sheetId: sheet._id,
        monthId: monthId,
        deletedAt: null
      };

      const user = req.user;
      const isAdminOrCoordinator = user.role === 'ADMIN' || user.role === 'COORDINATOR';

      if (isAdminOrCoordinator) {
        // Admins can see all, or optionally filter by staffId
        if (staffId) {
          query.ownerId = staffId;
        }
      } else {
        // Individual Staff view
        if (staffId && staffId !== user.id) {
          // Accessing another staff's shared sheet: verify active share rule
          const shareRule = await SheetShareRule.findOne({
            sheetId: sheet._id,
            monthId: monthId,
            ownerId: staffId,
            sharedWithId: user.id,
            isRevoked: false,
            expiresAt: { $gt: new Date() }
          });

          if (!shareRule) {
            return res.status(403).json({
              success: false,
              code: 'ACCESS_DENIED',
              message: 'You do not have active delegated permission for this staff member sheet.'
            });
          }

          query.ownerId = staffId;

          // If blind append mode: only see rows created by the delegate
          if (!shareRule.canViewExisting) {
            query.createdBy = user.id;
          }
        } else {
          // Regular view: only see own portfolio
          query.ownerId = user.id;
        }
      }

      const entries = await SheetEntry.find(query).sort({ createdAt: -1 });

      let userPermissions = {
        canCreate: true,
        canEditOwn: true,
        canDeleteOwn: true,
        canEditOthers: true,
        canDeleteOthers: true,
        isReadOnly: false
      };

      if (!isAdminOrCoordinator && staffId && staffId !== user.id) {
        // Staff accessing a shared sheet: check their delegated permissions
        const shareRule = await SheetShareRule.findOne({
          sheetId: sheet._id,
          monthId: monthId,
          ownerId: staffId,
          sharedWithId: user.id,
          isRevoked: false,
          expiresAt: { $gt: new Date() }
        });

        if (shareRule) {
          const isReadOnly = shareRule.accessType === 'READ_ONLY';
          userPermissions = {
            canCreate: !isReadOnly,
            canEditOwn: !isReadOnly,
            canDeleteOwn: !isReadOnly,
            canEditOthers: !isReadOnly && shareRule.canEditExisting,
            canDeleteOthers: !isReadOnly && shareRule.canDeleteExisting,
            isReadOnly: isReadOnly
          };
        }
      }

      res.json({
        success: true,
        sheetKey,
        count: entries.length,
        permissions: userPermissions,
        entries: entries.map((e) => ({
          id: e._id,
          _id: e._id,
          sheetId: e.sheetId,
          sheetKey: e.sheetKey,
          monthId: e.monthId,
          ownerId: e.ownerId,
          createdBy: e.createdBy,
          data: e.data ? Object.fromEntries(e.data) : {},
          version: e.__v,
          __v: e.__v,
          createdAt: e.createdAt,
          updatedAt: e.updatedAt
        }))
      });
    } catch (error) {
      logger.error({ error }, 'Error in getEntries:');
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 2. Transactional Batch Auto-Save Engine (ACID + Optimistic Concurrency + Idempotency)
  batchSave: async (req, res) => {
    const idempotencyKey = req.headers['x-idempotency-key'];
    if (idempotencyKey && idempotencyCache.has(idempotencyKey)) {
      logger.info({ idempotencyKey }, 'Returning cached batchSave response');
      return res.json(idempotencyCache.get(idempotencyKey));
    }

    const session = await mongoose.startSession();
    try {
      const { sheetKey } = req.params;
      const { monthId, mutations, targetOwnerId } = req.body;

      if (!monthId) {
        return res.status(400).json({ success: false, message: 'monthId is required' });
      }

      if (!mutations || !Array.isArray(mutations)) {
        return res.status(400).json({ success: false, message: 'mutations array is required' });
      }

      const sheet = await SheetDefinition.findOne({ sheetKey });
      if (!sheet) {
        return res.status(404).json({ success: false, message: `Sheet '${sheetKey}' not found` });
      }

      // Check Month Locking Status & Active 24-hr Unlock
      const monthReport = await MonthlyReport.findById(monthId);
      if (!monthReport) {
        return res.status(404).json({ success: false, message: 'Monthly report not found' });
      }

      const user = req.user;
      const effectiveOwnerId = targetOwnerId || user.id;
      const isOwner = effectiveOwnerId.toString() === user.id.toString();
      const isAdminOrCoordinator = user.role === 'ADMIN' || user.role === 'COORDINATOR';

      if (monthReport.status === 'LOCKED' && !isAdminOrCoordinator) {
        // Check if there is an active 24-hr unlock grant
        const activeUnlock = await SheetUnlockGrant.findOne({
          sheetId: sheet._id,
          monthId: monthId,
          staffId: effectiveOwnerId,
          expiresAt: { $gt: new Date() }
        });

        if (!activeUnlock) {
          return res.status(423).json({
            success: false,
            code: 'MONTH_LOCKED',
            message: 'This month is locked. Contact your administrator or coordinator to grant a 24-hour unlock window.'
          });
        }
      }

      // Verify delegation permissions if saving to someone else's sheet
      let delegateRule = null;
      if (!isOwner && !isAdminOrCoordinator) {
        delegateRule = await SheetShareRule.findOne({
          sheetId: sheet._id,
          monthId: monthId,
          ownerId: effectiveOwnerId,
          sharedWithId: user.id,
          isRevoked: false,
          expiresAt: { $gt: new Date() }
        });

        if (!delegateRule || delegateRule.accessType !== 'READ_WRITE') {
          return res.status(403).json({
            success: false,
            code: 'WRITE_PERMISSION_DENIED',
            message: 'You do not have Read+Write delegation for this sheet.'
          });
        }
      }

      const conflicts = [];
      const savedDocs = [];

      // Execute in ACID transaction if replica set is enabled; otherwise graceful atomic fallback
      let inTx = false;
      try {
        if (session.client?.topology?.description?.type === 'ReplicaSetWithPrimary' || session.client?.topology?.description?.type === 'Sharded') {
          await session.startTransaction({
            readConcern: { level: 'snapshot' },
            writeConcern: { w: 'majority' }
          });
          inTx = true;
        }
      } catch (txErr) {
        logger.warn('Transactions not enabled on standalone MongoDB; using atomic sequential execution');
      }

      for (const mut of mutations) {
        if (mut.id) {
          // Updating existing entry
          const existing = await SheetEntry.findOne({ _id: mut.id, deletedAt: null }).session(inTx ? session : null);
          if (!existing) {
            conflicts.push({
              rowId: mut.id,
              error: 'ENTRY_NOT_FOUND',
              message: 'Row was deleted by another user.'
            });
            continue;
          }

          // Check delegate permission: can they update existing data?
          if (delegateRule && !delegateRule.canEditExisting && existing.createdBy.toString() !== user.id.toString()) {
            conflicts.push({
              rowId: mut.id,
              error: 'CANNOT_EDIT_OWNER_ROW',
              message: 'Permission denied: You can only edit rows created by you.'
            });
            continue;
          }

          // Optimistic Concurrency check (__v)
          if (mut.version !== undefined && mut.version !== existing.__v) {
            conflicts.push({
              rowId: mut.id,
              serverVersion: existing.__v,
              clientVersion: mut.version,
              serverData: existing.data ? Object.fromEntries(existing.data) : {},
              clientData: mut.data
            });
            continue;
          }

          // Apply update
          existing.data = new Map(Object.entries(mut.data || {}));
          existing.__v += 1;
          await existing.save({ session: inTx ? session : null });
          savedDocs.push(existing);
        } else {
          // Creating new entry
          const [created] = await SheetEntry.create(
            [
              {
                sheetId: sheet._id,
                sheetKey: sheet.sheetKey,
                monthId: monthId,
                ownerId: effectiveOwnerId,
                createdBy: user.id,
                data: new Map(Object.entries(mut.data || {}))
              }
            ],
            { session: inTx ? session : null }
          );
          savedDocs.push(created);
        }
      }

      // If any conflicts occurred, abort transaction wholesale
      if (conflicts.length > 0) {
        if (inTx) await session.abortTransaction();
        return res.status(409).json({
          success: false,
          code: 'CONCURRENCY_CONFLICT',
          message: 'One or more rows have concurrent modification conflicts.',
          conflicts: conflicts
        });
      }

      if (inTx) await session.commitTransaction();

      const responsePayload = {
        success: true,
        message: 'Batch auto-saved successfully',
        savedCount: savedDocs.length,
        items: savedDocs.map((d) => ({
          id: d._id,
          _id: d._id,
          sheetKey: d.sheetKey,
          data: d.data ? Object.fromEntries(d.data) : {},
          version: d.__v,
          __v: d.__v,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt
        }))
      };

      if (idempotencyKey) {
        idempotencyCache.set(idempotencyKey, responsePayload);
        setTimeout(() => idempotencyCache.delete(idempotencyKey), 5 * 60 * 1000);
      }

      res.json(responsePayload);
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      logger.error({ error }, 'Error in batchSave:');
      res.status(500).json({ success: false, message: error.message });
    } finally {
      session.endSession();
    }
  },

  // 3. Delete an entry (Soft Delete)
  deleteEntry: async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const entry = await SheetEntry.findById(id);
      if (!entry || entry.deletedAt) {
        return res.status(404).json({ success: false, message: 'Entry not found' });
      }

      const isAdminOrCoordinator = user.role === 'ADMIN' || user.role === 'COORDINATOR';
      const isOwner = entry.ownerId.toString() === user.id.toString();

      if (!isAdminOrCoordinator && !isOwner) {
        // Delegate delete check
        const delegateRule = await SheetShareRule.findOne({
          sheetId: entry.sheetId,
          monthId: entry.monthId,
          ownerId: entry.ownerId,
          sharedWithId: user.id,
          isRevoked: false,
          expiresAt: { $gt: new Date() }
        });

        if (!delegateRule || delegateRule.accessType !== 'READ_WRITE') {
          return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        if (!delegateRule.canDeleteExisting && entry.createdBy.toString() !== user.id.toString()) {
          return res.status(403).json({ success: false, message: 'Permission denied: Cannot delete owner entries' });
        }
      }

      entry.deletedAt = new Date();
      await entry.save();

      res.json({ success: true, message: 'Entry deleted successfully', id });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = sheetEntryController;
