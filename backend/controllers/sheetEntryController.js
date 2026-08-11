const models = require('../models');

const sheetEntryController = {
  // Create an entry in any of the 52 sheet collections
  createEntry: async (req, res) => {
    try {
      const { sheetName } = req.params;
      const TargetModel = models[sheetName];

      if (!TargetModel) {
        return res.status(404).json({ success: false, message: `Sheet '${sheetName}' does not exist.` });
      }

      if (!req.body.month_id) {
        return res.status(400).json({ success: false, message: 'month_id is required' });
      }

      const newEntry = await TargetModel.create(req.body);
      res.status(201).json({ success: true, data: newEntry });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  // Get all entries for a specific sheet under a specific month
  getEntriesByMonth: async (req, res) => {
    try {
      const { sheetName, monthId } = req.params;
      const TargetModel = models[sheetName];

      if (!TargetModel) {
        return res.status(404).json({ success: false, message: `Sheet '${sheetName}' does not exist.` });
      }

      const query = { month_id: monthId };
      if (req.query.created_by) {
        query.created_by = req.query.created_by;
      }

      const items = await TargetModel.find(query);
      res.json({ success: true, count: items.length, data: items });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get a single entry by entry ID for a specific sheet
  getEntryById: async (req, res) => {
    try {
      const { sheetName, id } = req.params;
      const TargetModel = models[sheetName];

      if (!TargetModel) {
        return res.status(404).json({ success: false, message: `Sheet '${sheetName}' does not exist.` });
      }

      const item = await TargetModel.findById(id);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Entry not found' });
      }

      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Update a sheet entry by ID
  updateEntry: async (req, res) => {
    try {
      const { sheetName, id } = req.params;
      const TargetModel = models[sheetName];

      if (!TargetModel) {
        return res.status(404).json({ success: false, message: `Sheet '${sheetName}' does not exist.` });
      }

      const updatedItem = await TargetModel.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
      if (!updatedItem) {
        return res.status(404).json({ success: false, message: 'Entry not found' });
      }

      res.json({ success: true, data: updatedItem });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  // Delete a sheet entry by ID
  deleteEntry: async (req, res) => {
    try {
      const { sheetName, id } = req.params;
      const TargetModel = models[sheetName];

      if (!TargetModel) {
        return res.status(404).json({ success: false, message: `Sheet '${sheetName}' does not exist.` });
      }

      const deletedItem = await TargetModel.findByIdAndDelete(id);
      if (!deletedItem) {
        return res.status(404).json({ success: false, message: 'Entry not found' });
      }

      res.json({ success: true, message: 'Entry deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = sheetEntryController;
