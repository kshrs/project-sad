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
  // Get metadata list of all 52 sheets with document counts (optional ?month_id=... filter)
  getAllSheetsMetadata: async (req, res) => {
    try {
      const { month_id } = req.query;
      const filter = month_id ? { month_id } : {};
      const sheetModels = getSheetModels();

      const sheetsList = await Promise.all(
        Object.keys(sheetModels).map(async (modelName) => {
          const Model = sheetModels[modelName];
          const count = await Model.countDocuments(filter);
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

  // Fetch all entries for a specific sheet by sheetName (optional ?month_id=... filter)
  getSheetItems: async (req, res) => {
    try {
      const { sheetName } = req.params;
      const { month_id } = req.query;
      const filter = month_id ? { month_id } : {};
      const TargetModel = models[sheetName];

      if (!TargetModel || sheetName === 'AcademicYear' || sheetName === 'MonthlyReport') {
        return res.status(404).json({ success: false, message: `Sheet '${sheetName}' not found.` });
      }

      const items = await TargetModel.find(filter);
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

  // Fetch aggregate report containing entries across all 52 sheets (optional ?month_id=... filter)
  getFullReport: async (req, res) => {
    try {
      const { month_id } = req.query;
      const filter = month_id ? { month_id } : {};
      const sheetModels = getSheetModels();
      const fullReport = {};

      await Promise.all(
        Object.keys(sheetModels).map(async (modelName) => {
          const Model = sheetModels[modelName];
          const items = await Model.find(filter);
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
