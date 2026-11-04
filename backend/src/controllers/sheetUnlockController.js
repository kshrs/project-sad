const { SheetUnlockGrant, SheetDefinition, MonthlyReport } = require('../models');
const logger = require('../config/logger');

const sheetUnlockController = {
  // Grant a 24-hour unlock window for a staff sheet in a locked month (Strict Max 2 per sheet/month)
  grantUnlock: async (req, res) => {
    try {
      const { sheetKey, monthId, staffId } = req.body;
      const approvedById = req.user.id;

      if (!sheetKey || !monthId || !staffId) {
        return res.status(400).json({ success: false, message: 'sheetKey, monthId, and staffId are required' });
      }

      const sheet = await SheetDefinition.findOne({ sheetKey });
      if (!sheet) {
        return res.status(404).json({ success: false, message: 'Sheet not found' });
      }

      const month = await MonthlyReport.findById(monthId);
      if (!month) {
        return res.status(404).json({ success: false, message: 'Month not found' });
      }

      // Check current unlock count
      const existingGrants = await SheetUnlockGrant.find({
        sheetId: sheet._id,
        monthId: monthId,
        staffId: staffId
      });

      if (existingGrants.length >= 2) {
        return res.status(400).json({
          success: false,
          code: 'MAX_UNLOCKS_REACHED',
          message: 'The maximum limit of 2 unlock windows for this sheet and month has already been reached.'
        });
      }

      const sequenceNumber = existingGrants.length + 1;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Strict 24 hours

      const grant = await SheetUnlockGrant.create({
        sheetId: sheet._id,
        monthId: monthId,
        staffId: staffId,
        approvedById: approvedById,
        unlockSequenceNumber: sequenceNumber,
        expiresAt: expiresAt
      });

      res.status(201).json({
        success: true,
        message: `Granted 24-hour unlock window (Attempt ${sequenceNumber} of 2)`,
        grant: {
          id: grant._id,
          sequenceNumber: grant.unlockSequenceNumber,
          expiresAt: grant.expiresAt,
          remainingUnlocks: 2 - sequenceNumber
        }
      });
    } catch (error) {
      logger.error({ error }, 'Error in grantUnlock:');
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Check unlock status for a sheet/month/staff
  getUnlockStatus: async (req, res) => {
    try {
      const { sheetKey } = req.params;
      const { monthId, staffId } = req.query;

      const sheet = await SheetDefinition.findOne({ sheetKey });
      if (!sheet) {
        return res.status(404).json({ success: false, message: 'Sheet not found' });
      }

      const targetStaffId = staffId || req.user.id;

      const activeGrant = await SheetUnlockGrant.findOne({
        sheetId: sheet._id,
        monthId: monthId,
        staffId: targetStaffId,
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 });

      const totalGrants = await SheetUnlockGrant.countDocuments({
        sheetId: sheet._id,
        monthId: monthId,
        staffId: targetStaffId
      });

      res.json({
        success: true,
        isUnlocked: !!activeGrant,
        activeGrant: activeGrant ? {
          expiresAt: activeGrant.expiresAt,
          sequenceNumber: activeGrant.unlockSequenceNumber
        } : null,
        totalUnlocksUsed: totalGrants,
        remainingUnlocks: Math.max(0, 2 - totalGrants)
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = sheetUnlockController;
