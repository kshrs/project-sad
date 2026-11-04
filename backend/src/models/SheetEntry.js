const mongoose = require('mongoose');

const SheetEntrySchema = new mongoose.Schema(
  {
    sheetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SheetDefinition',
      required: true,
      index: true
    },
    sheetKey: {
      type: String,
      required: true,
      index: true
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
      index: true // The staff whose portfolio this entry belongs to
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true // The individual user (owner or delegate) who physically entered this row
    },
    data: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
    versionKey: '__v'
  }
);

// High-performance compound indexes
SheetEntrySchema.index({ sheetId: 1, monthId: 1, ownerId: 1, deletedAt: 1 });
SheetEntrySchema.index({ sheetKey: 1, monthId: 1, ownerId: 1, deletedAt: 1 });
SheetEntrySchema.index({ ownerId: 1, monthId: 1, deletedAt: 1 });
SheetEntrySchema.index({ createdBy: 1, deletedAt: 1 });

module.exports = mongoose.model('SheetEntry', SheetEntrySchema);
