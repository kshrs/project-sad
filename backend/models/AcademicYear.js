const mongoose = require('mongoose');

const AcademicYearSchema = new mongoose.Schema(
  {
    academic_year: { type: String, required: true }, // e.g., "2025-2026"
    department: { type: String, required: true }, // e.g., "IT"
    created_by: { type: String }, // HOD or Admin user ID
  },
  { timestamps: true }
);

module.exports = mongoose.model('AcademicYear', AcademicYearSchema);
