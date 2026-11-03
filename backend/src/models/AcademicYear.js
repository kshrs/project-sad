const mongoose = require('mongoose');

const AcademicYearSchema = new mongoose.Schema(
  {
    yearKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    }, // e.g. "2025-2026"
    displayName: {
      type: String,
      required: true
    },
    department: {
      type: String,
      default: 'Information Technology'
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AcademicYear', AcademicYearSchema);
