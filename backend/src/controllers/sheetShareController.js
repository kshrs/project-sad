const { SheetShareRule, SheetDefinition, User } = require('../models');
const logger = require('../config/logger');

const sheetShareController = {
  // 1. Grant/Create delegation access to a sheet
  grantShare: async (req, res) => {
    try {
      const { sheetKey, monthId, sharedWithEmail, accessType, canViewExisting, canEditExisting, canDeleteExisting, expiresAt } = req.body;
      const ownerId = req.user.id;

      if (!sheetKey || !monthId || !sharedWithEmail) {
        return res.status(400).json({ success: false, message: 'sheetKey, monthId, and sharedWithEmail are required' });
      }

      const sheet = await SheetDefinition.findOne({ sheetKey });
      if (!sheet) {
        return res.status(404).json({ success: false, message: `Sheet '${sheetKey}' not found` });
      }

      const recipient = await User.findOne({ email: sharedWithEmail.toLowerCase().trim() });
      if (!recipient) {
        return res.status(404).json({ success: false, message: `Staff user '${sharedWithEmail}' not found in institution database` });
      }

      if (recipient._id.toString() === ownerId.toString()) {
        return res.status(400).json({ success: false, message: 'Cannot share sheet with yourself' });
      }

      // Default expiry to 1 week if not specified
      const finalExpiry = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const isReadOnly = accessType === 'READ_ONLY';
      const effectiveCanView = isReadOnly ? true : (canViewExisting !== undefined ? canViewExisting : true);
      const effectiveCanEdit = isReadOnly ? false : (effectiveCanView ? (canEditExisting !== undefined ? canEditExisting : false) : false);
      const effectiveCanDelete = isReadOnly ? false : (effectiveCanView ? (canDeleteExisting !== undefined ? canDeleteExisting : false) : false);

      const rule = await SheetShareRule.findOneAndUpdate(
        {
          sheetId: sheet._id,
          monthId: monthId,
          ownerId: ownerId,
          sharedWithId: recipient._id
        },
        {
          sheetKey: sheet.sheetKey,
          accessType: accessType || 'READ_ONLY',
          canViewExisting: effectiveCanView,
          canEditExisting: effectiveCanEdit,
          canDeleteExisting: effectiveCanDelete,
          expiresAt: finalExpiry,
          isRevoked: false
        },
        { upsert: true, new: true }
      ).populate('sharedWithId', 'displayName email avatarUrl department');

      res.status(201).json({
        success: true,
        message: `Successfully delegated access to ${recipient.displayName}`,
        rule
      });
    } catch (error) {
      logger.error({ error }, 'Error in grantShare:');
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 2. Get active delegations granted for a sheet (Staff sees rules they granted; Admin sees all active rules for this sheet/month or specific staff)
  getGrantedShares: async (req, res) => {
    try {
      const { sheetKey } = req.params;
      const { monthId, staffId } = req.query;
      const user = req.user;
      const isAdminOrCoordinator = user.role === 'ADMIN' || user.role === 'COORDINATOR';

      const sheet = await SheetDefinition.findOne({ sheetKey });
      if (!sheet) {
        return res.status(404).json({ success: false, message: 'Sheet not found' });
      }

      let query = {
        sheetId: sheet._id,
        monthId: monthId,
        isRevoked: false,
        expiresAt: { $gt: new Date() }
      };

      if (isAdminOrCoordinator) {
        // Admin monitoring: filter by specific staff if provided, or view all delegations for this sheet
        if (staffId) {
          query.ownerId = staffId;
        }
      } else {
        // Staff view: only see rules granted from their own account
        query.ownerId = user.id;
      }

      const rules = await SheetShareRule.find(query)
        .populate('ownerId', 'displayName email avatarUrl department')
        .populate('sharedWithId', 'displayName email avatarUrl department');

      res.json({
        success: true,
        count: rules.length,
        shares: rules
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 3. Revoke delegation access (Staff can revoke their own rules; Admin can revoke/modify any rule)
  revokeShare: async (req, res) => {
    try {
      const { ruleId } = req.params;
      const user = req.user;
      const isAdminOrCoordinator = user.role === 'ADMIN' || user.role === 'COORDINATOR';

      let query = { _id: ruleId };
      if (!isAdminOrCoordinator) {
        query.ownerId = user.id;
      }

      const rule = await SheetShareRule.findOne(query);
      if (!rule) {
        return res.status(404).json({ success: false, message: 'Share rule not found or you do not have permission' });
      }

      rule.isRevoked = true;
      await rule.save();

      res.json({ success: true, message: 'Access revoked successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = sheetShareController;
