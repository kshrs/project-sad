const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    authProvider: {
      type: String,
      enum: ['local_dev', 'google', 'microsoft'],
      default: 'local_dev'
    },
    providerSub: {
      type: String,
      sparse: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['ADMIN', 'COORDINATOR', 'STAFF'],
      default: 'STAFF',
      index: true
    },
    department: {
      type: String,
      default: 'Information Technology'
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

UserSchema.index({ email: 1, role: 1 });
UserSchema.index({ displayName: 'text', email: 'text' });

module.exports = mongoose.model('User', UserSchema);
