const mongoose = require('mongoose');

const SheetUnlockGrantSchema = new mongoose.Schema(
  {
    sheetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SheetDefinition',
      required: true,
      index: true
    },
    monthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MonthlyReport',
      required: true,
      index: true
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    approvedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    unlockSequenceNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 2 // Strict max 2 unlocks per sheet/month
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true // Strict 24-hr expiry
    }
  },
  {
    timestamps: true
  }
);

SheetUnlockGrantSchema.index({ sheetId: 1, monthId: 1, staffId: 1 });

module.exports = mongoose.model('SheetUnlockGrant', SheetUnlockGrantSchema);
