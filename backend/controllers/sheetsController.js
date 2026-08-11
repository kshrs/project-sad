const models = require('../models');

// Extract all 52 sheet models dynamically from models object
const getSheetModels = () => {
  const sheetModels = {};
  Object.keys(models).forEach((key) => {
    if (key !== 'AcademicYear' && key !== 'MonthlyReport') {
      sheetModels[key] = models[key];
    }
  });
  return sheetModels;
};

const sheetsController = {
  // Get metadata list of all 52 sheets with current document counts
  getAllSheetsMetadata: async (req, res) => {
    try {
      const sheetModels = getSheetModels();
      const sheetsList = await Promise.all(
        Object.keys(sheetModels).map(async (modelName) => {
          const Model = sheetModels[modelName];
          const count = await Model.countDocuments();
          return {
            sheetName: modelName,
            totalItems: count
          };
        })
      );
      res.json({ success: true, count: sheetsList.length, sheets: sheetsList });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Fetch all entries for a specific sheet by sheetName
  getSheetItems: async (req, res) => {
    try {
      const { sheetName } = req.params;
      const TargetModel = models[sheetName];

      if (!TargetModel || sheetName === 'AcademicYear' || sheetName === 'MonthlyReport') {
        return res.status(404).json({ success: false, message: `Sheet '${sheetName}' not found.` });
      }

      const items = await TargetModel.find();
      res.json({
        success: true,
        sheetName: sheetName,
        totalItems: items.length,
        items: items
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Fetch aggregate report containing all entries across all 52 sheets
  getFullReport: async (req, res) => {
    try {
      const sheetModels = getSheetModels();
      const fullReport = {};
      await Promise.all(
        Object.keys(sheetModels).map(async (modelName) => {
          const Model = sheetModels[modelName];
          const items = await Model.find();
          fullReport[modelName] = {
            totalItems: items.length,
            items: items
          };
        })
      );
      res.json({ success: true, report: fullReport });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = sheetsController;
