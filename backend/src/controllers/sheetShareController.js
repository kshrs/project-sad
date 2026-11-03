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
          canViewExisting: canViewExisting !== undefined ? canViewExisting : true,
          canEditExisting: canEditExisting !== undefined ? canEditExisting : false,
          canDeleteExisting: canDeleteExisting !== undefined ? canDeleteExisting : false,
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

  // 2. Get active delegations granted by current user for a sheet
  getGrantedShares: async (req, res) => {
    try {
      const { sheetKey } = req.params;
      const { monthId } = req.query;
      const ownerId = req.user.id;

      const sheet = await SheetDefinition.findOne({ sheetKey });
      if (!sheet) {
        return res.status(404).json({ success: false, message: 'Sheet not found' });
      }

      const rules = await SheetShareRule.find({
        sheetId: sheet._id,
        monthId: monthId,
        ownerId: ownerId,
        isRevoked: false,
        expiresAt: { $gt: new Date() }
      }).populate('sharedWithId', 'displayName email avatarUrl department');

      res.json({
        success: true,
        count: rules.length,
        shares: rules
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 3. Revoke delegation access
  revokeShare: async (req, res) => {
    try {
      const { ruleId } = req.params;
      const ownerId = req.user.id;

      const rule = await SheetShareRule.findOne({ _id: ruleId, ownerId: ownerId });
      if (!rule) {
        return res.status(404).json({ success: false, message: 'Share rule not found or you are not the owner' });
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
