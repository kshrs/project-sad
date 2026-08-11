const models = require('../models');

const academicYearController = {
  // Create a new Academic Year
  createYear: async (req, res) => {
    try {
      const { academic_year, department, created_by } = req.body;
      if (!academic_year || !department) {
        return res.status(400).json({ success: false, message: 'Academic year and department are required' });
      }
      const newYear = await models.AcademicYear.create({
        academic_year,
        department,
        created_by
      });
      res.status(201).json({ success: true, data: newYear });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get all Academic Years
  getAllYears: async (req, res) => {
    try {
      const years = await models.AcademicYear.find().sort({ createdAt: -1 });
      res.json({ success: true, data: years });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get Academic Year by ID
  getYearById: async (req, res) => {
    try {
      const year = await models.AcademicYear.findById(req.params.id);
      if (!year) {
        return res.status(404).json({ success: false, message: 'Academic Year not found' });
      }
      res.json({ success: true, data: year });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Delete Academic Year by ID
  deleteYear: async (req, res) => {
    try {
      const deletedYear = await models.AcademicYear.findByIdAndDelete(req.params.id);
      if (!deletedYear) {
        return res.status(404).json({ success: false, message: 'Academic Year not found' });
      }
      res.json({ success: true, message: 'Academic Year deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = academicYearController;
