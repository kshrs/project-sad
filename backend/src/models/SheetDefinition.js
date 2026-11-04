const mongoose = require('mongoose');

const ColumnDefinitionSchema = new mongoose.Schema(
  {
    fieldKey: { type: String, required: true }, // Immutable system identifier
    label: { type: String, required: true },    // Mutable user display label
    type: {
      type: String,
      enum: ['String', 'Number', 'Date', 'Boolean', 'File'],
      default: 'String'
    },
    required: { type: Boolean, default: false },
    options: [{ type: String }] // For select/dropdown fields
  },
  { _id: false }
);

const SheetDefinitionSchema = new mongoose.Schema(
  {
    sheetKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['FACULTY', 'STUDENT', 'RESEARCH', 'OUTREACH', 'GENERAL'],
      default: 'GENERAL',
      index: true
    },
    orderIndex: {
      type: Number,
      default: 0
    },
    columns: [ColumnDefinitionSchema],
    targetScope: {
      type: String,
      enum: ['ALL', 'SELECTED'],
      default: 'ALL'
    },
    isSystemDefault: {
      type: Boolean,
      default: false
    },
    isArchived: {
      type: Boolean,
      default: false
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

SheetDefinitionSchema.index({ category: 1, orderIndex: 1 });

module.exports = mongoose.model('SheetDefinition', SheetDefinitionSchema);
