const mongoose = require('mongoose');

const AccessRuleSchema = new mongoose.Schema(
  {
    from_user: { type: String, required: true },
    to_user: { type: String, required: true },
    permission: { type: String, enum: ['READ', 'WRITE'], default: 'READ' }
  },
  { _id: false }
);

const MonthlyReportSchema = new mongoose.Schema(
  {
    year_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    month_name: { type: String, required: true }, // e.g., "August"
    month_number: { type: Number, required: true }, // 1 - 12
    status: { type: String, enum: ['DRAFT', 'SUBMITTED', 'APPROVED'], default: 'DRAFT' },
    access_rules: [AccessRuleSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('MonthlyReport', MonthlyReportSchema);
