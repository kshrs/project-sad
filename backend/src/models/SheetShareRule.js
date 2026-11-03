const mongoose = require('mongoose');

const SheetShareRuleSchema = new mongoose.Schema(
  {
    sheetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SheetDefinition',
      required: true,
      index: true
    },
    sheetKey: {
      type: String,
      required: true
    },
    monthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MonthlyReport',
      required: true,
      index: true
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    sharedWithId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    accessType: {
      type: String,
      enum: ['READ_ONLY', 'READ_WRITE'],
      default: 'READ_ONLY'
    },
    canViewExisting: {
      type: Boolean,
      default: true // If false: blind append mode (can only see own rows)
    },
    canEditExisting: {
      type: Boolean,
      default: false // If true: can update/delete owner-created rows
    },
    canDeleteExisting: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date,
      required: true
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

SheetShareRuleSchema.index({ sharedWithId: 1, sheetId: 1, monthId: 1, isRevoked: 1 });
SheetShareRuleSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // MongoDB TTL cleanup

module.exports = mongoose.model('SheetShareRule', SheetShareRuleSchema);
