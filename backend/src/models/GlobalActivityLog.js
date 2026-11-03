const mongoose = require('mongoose');

const GlobalActivityLogSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    timestampIST: {
      type: String,
      required: true
    },
    actor: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      email: { type: String, required: true },
      displayName: { type: String, required: true },
      role: { type: String, enum: ['ADMIN', 'COORDINATOR', 'STAFF'], required: true }
    },
    action: {
      type: String,
      required: true,
      index: true,
      enum: [
        'AUTH_LOGIN',
        'AUTH_LOGOUT',
        'ENTRY_CREATE',
        'ENTRY_AUTO_SAVE_UPDATE',
        'ENTRY_DELETE',
        'ENTRY_UNDO_RESTORE',
        'SHARE_GRANT',
        'SHARE_REVOKE',
        'MONTH_UNLOCK_GRANT',
        'PDF_REPORT_EXPORT',
        'FILE_UPLOAD',
        'FILE_DELETE',
        'SCHEMA_COLUMN_ADD',
        'SCHEMA_COLUMN_RENAME',
        'SHEET_CREATE',
        'SHEET_DELETE'
      ]
    },
    target: {
      sheetId: { type: mongoose.Schema.Types.ObjectId, ref: 'SheetDefinition', index: true },
      sheetKey: { type: String },
      monthId: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyReport' },
      monthKey: { type: String },
      entryId: { type: mongoose.Schema.Types.ObjectId },
      fileId: { type: mongoose.Schema.Types.ObjectId }
    },
    diff: {
      before: { type: mongoose.Schema.Types.Mixed },
      after: { type: mongoose.Schema.Types.Mixed }
    },
    metadata: {
      ipAddress: { type: String },
      userAgent: { type: String },
      requestId: { type: String, index: true }
    }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

// Strictly append-only compound indexes
GlobalActivityLogSchema.index({ 'actor.userId': 1, timestamp: -1 });
GlobalActivityLogSchema.index({ 'target.sheetId': 1, timestamp: -1 });
GlobalActivityLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('GlobalActivityLog', GlobalActivityLogSchema);
