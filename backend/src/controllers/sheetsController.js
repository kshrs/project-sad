const { SheetDefinition, SheetEntry, SheetShareRule, User } = require('../models');
const logger = require('../config/logger');

const sheetsController = {
  // 1. Get all sheets metadata with entry counts for active month
  getSheetsMetadata: async (req, res) => {
    try {
      const { monthId, staffId } = req.query;
      const user = req.user;

      const sheets = await SheetDefinition.find({ isArchived: false }).sort({ category: 1, orderIndex: 1 });

      const targetOwnerId = staffId || user.id;

      const results = await Promise.all(
        sheets.map(async (sheet) => {
          let count = 0;
          if (monthId) {
            count = await SheetEntry.countDocuments({
              sheetId: sheet._id,
              monthId: monthId,
              ownerId: targetOwnerId,
              deletedAt: null
            });
          }

          return {
            id: sheet._id,
            sheetKey: sheet.sheetKey,
            displayName: sheet.displayName,
            category: sheet.category,
            columnsCount: sheet.columns.length,
            totalItems: count,
            isSystemDefault: sheet.isSystemDefault
          };
        })
      );

      // Also fetch sheets shared with this user for the month
      let sharedSheets = [];
      if (monthId) {
        const shareRules = await SheetShareRule.find({
          sharedWithId: user.id,
          monthId: monthId,
          isRevoked: false,
          expiresAt: { $gt: new Date() }
        })
          .populate('sheetId', 'sheetKey displayName category')
          .populate('ownerId', 'displayName email avatarUrl department');

        sharedSheets = await Promise.all(
          shareRules.map(async (rule) => {
            if (!rule.sheetId) return null;
            const count = await SheetEntry.countDocuments({
              sheetId: rule.sheetId._id,
              monthId: monthId,
              ownerId: rule.ownerId._id,
              deletedAt: null,
              ...(rule.canViewExisting ? {} : { createdBy: user.id })
            });

            return {
              ruleId: rule._id,
              sheetKey: rule.sheetKey,
              sheetName: rule.sheetId.displayName,
              category: rule.sheetId.category,
              owner: {
                id: rule.ownerId._id,
                displayName: rule.ownerId.displayName,
                email: rule.ownerId.email,
                avatarUrl: rule.ownerId.avatarUrl
              },
              accessType: rule.accessType,
              canViewExisting: rule.canViewExisting,
              canEditExisting: rule.canEditExisting,
              canDeleteExisting: rule.canDeleteExisting,
              expiresAt: rule.expiresAt,
              totalItems: count
            };
          })
        );
        sharedSheets = sharedSheets.filter(Boolean);
      }

      res.json({
        success: true,
        count: results.length,
        sheets: results,
        sharedWithMe: sharedSheets
      });
    } catch (error) {
      logger.error({ error }, 'Error in getSheetsMetadata:');
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 2. Get columns definition for a specific sheet
  getSheetColumns: async (req, res) => {
    try {
      const { sheetKey } = req.params;
      const sheet = await SheetDefinition.findOne({ sheetKey });
      if (!sheet) {
        return res.status(404).json({ success: false, message: `Sheet '${sheetKey}' not found` });
      }

      res.json({
        success: true,
        sheetKey: sheet.sheetKey,
        displayName: sheet.displayName,
        category: sheet.category,
        columns: sheet.columns
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 3. Admin: Modify schema (strictly allows ADDING columns and RENAMING labels; prohibits column removal)
  modifySchema: async (req, res) => {
    try {
      const { sheetId } = req.params;
      const { columns } = req.body;

      if (!columns || !Array.isArray(columns)) {
        return res.status(400).json({ success: false, message: 'columns array is required' });
      }

      const sheet = await SheetDefinition.findById(sheetId);
      if (!sheet) {
        return res.status(404).json({ success: false, message: 'Sheet not found' });
      }

      // Safe evolution guard: Check that all existing fieldKeys remain present
      const existingKeys = sheet.columns.map((col) => col.fieldKey);
      const incomingKeys = new Set(columns.map((col) => col.fieldKey));

      const missingKeys = existingKeys.filter((key) => !incomingKeys.has(key));
      if (missingKeys.length > 0) {
        return res.status(400).json({
          success: false,
          code: 'COLUMN_DELETION_FORBIDDEN',
          message: `Removing columns (${missingKeys.join(', ')}) from an active sheet is prohibited to prevent data corruption. To restructure this schema, delete the sheet and recreate a new one.`
        });
      }

      sheet.columns = columns;
      await sheet.save();

      res.json({
        success: true,
        message: 'Sheet schema updated successfully',
        columns: sheet.columns
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 4. Admin: Create a new custom sheet definition and publish
  createSheet: async (req, res) => {
    try {
      const { sheetKey, displayName, category, columns, targetScope } = req.body;

      if (!sheetKey || !displayName || !columns) {
        return res.status(400).json({ success: false, message: 'sheetKey, displayName, and columns are required' });
      }

      const existing = await SheetDefinition.findOne({ sheetKey: sheetKey.trim() });
      if (existing) {
        return res.status(400).json({ success: false, message: `Sheet with key '${sheetKey}' already exists` });
      }

      const newSheet = await SheetDefinition.create({
        sheetKey: sheetKey.trim(),
        displayName: displayName.trim(),
        category: category || 'GENERAL',
        columns: columns,
        targetScope: targetScope || 'ALL',
        isSystemDefault: false,
        createdBy: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'New sheet created and published successfully',
        sheet: newSheet
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 5. Admin: Delete sheet (Soft archive)
  deleteSheet: async (req, res) => {
    try {
      const { sheetId } = req.params;
      const sheet = await SheetDefinition.findById(sheetId);
      if (!sheet) {
        return res.status(404).json({ success: false, message: 'Sheet not found' });
      }

      sheet.isArchived = true;
      await sheet.save();

      // Soft delete all associated entries
      await SheetEntry.updateMany({ sheetId: sheet._id }, { $set: { deletedAt: new Date() } });

      res.json({
        success: true,
        message: `Sheet '${sheet.displayName}' archived and entries removed from active view.`
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = sheetsController;
