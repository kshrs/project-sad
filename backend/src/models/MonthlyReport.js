const mongoose = require('mongoose');

const MonthlyReportSchema = new mongoose.Schema(
  {
    yearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true
    },
    monthKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    }, // e.g. "2025-07"
    monthNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    monthName: {
      type: String,
      required: true
    }, // e.g. "July"
    status: {
      type: String,
      enum: ['ACTIVE', 'LOCKED', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true
    },
    lockDateIST: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

MonthlyReportSchema.index({ yearId: 1, monthNumber: 1 });

module.exports = mongoose.model('MonthlyReport', MonthlyReportSchema);
