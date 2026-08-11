const models = require('../models');

const monthlyReportController = {
  // Create a Monthly Report for an Academic Year
  createMonthlyReport: async (req, res) => {
    try {
      const { year_id, month_name, month_number, access_rules } = req.body;
      if (!year_id || !month_name || !month_number) {
        return res.status(400).json({ success: false, message: 'year_id, month_name, and month_number are required' });
      }
      const newReport = await models.MonthlyReport.create({
        year_id,
        month_name,
        month_number,
        access_rules: access_rules || []
      });
      res.status(201).json({ success: true, data: newReport });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get all Monthly Reports for a specific Academic Year
  getReportsByYear: async (req, res) => {
    try {
      const { yearId } = req.params;
      const reports = await models.MonthlyReport.find({ year_id: yearId }).sort({ month_number: 1 });
      res.json({ success: true, data: reports });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get single Monthly Report by ID
  getReportById: async (req, res) => {
    try {
      const report = await models.MonthlyReport.findById(req.params.id);
      if (!report) {
        return res.status(404).json({ success: false, message: 'Monthly report not found' });
      }
      res.json({ success: true, data: report });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Add an access rule (one-way visibility permission)
  addAccessRule: async (req, res) => {
    try {
      const { monthId } = req.params;
      const { from_user, to_user, permission } = req.body;

      if (!from_user || !to_user) {
        return res.status(400).json({ success: false, message: 'from_user and to_user are required' });
      }

      const updatedReport = await models.MonthlyReport.findByIdAndUpdate(
        monthId,
        {
          $push: {
            access_rules: { from_user, to_user, permission: permission || 'READ' }
          }
        },
        { new: true }
      );

      if (!updatedReport) {
        return res.status(404).json({ success: false, message: 'Monthly report not found' });
      }

      res.json({ success: true, data: updatedReport });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Revoke an access rule (remove one-way visibility permission)
  revokeAccessRule: async (req, res) => {
    try {
      const { monthId } = req.params;
      const { from_user, to_user } = req.body;

      if (!from_user || !to_user) {
        return res.status(400).json({ success: false, message: 'from_user and to_user are required' });
      }

      const updatedReport = await models.MonthlyReport.findByIdAndUpdate(
        monthId,
        {
          $pull: {
            access_rules: { from_user, to_user }
          }
        },
        { new: true }
      );

      if (!updatedReport) {
        return res.status(404).json({ success: false, message: 'Monthly report not found' });
      }

      res.json({ success: true, data: updatedReport });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Update Monthly Report status (DRAFT -> SUBMITTED -> APPROVED)
  updateStatus: async (req, res) => {
    try {
      const { monthId } = req.params;
      const { status } = req.body;

      if (!['DRAFT', 'SUBMITTED', 'APPROVED'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value' });
      }

      const updatedReport = await models.MonthlyReport.findByIdAndUpdate(
        monthId,
        { status },
        { new: true }
      );

      if (!updatedReport) {
        return res.status(404).json({ success: false, message: 'Monthly report not found' });
      }

      res.json({ success: true, data: updatedReport });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = monthlyReportController;
