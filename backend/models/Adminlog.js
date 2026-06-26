const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: [
        'ban_user',
        'unban_user',
        'delete_item',
        'restore_item',
        'resolve_report',
        'dismiss_report',
        'confirm_content_flag',
        'dismiss_content_flag',
        'verify_student',
        'revoke_student',
        'make_admin',
        'revoke_admin',
      ],
      required: true,
    },
    targetType: {
      type: String,
      enum: ['user', 'item', 'report', 'contentFlag'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed, // any extra context
      default: {},
    },
  },
  { timestamps: true }
);

adminLogSchema.index({ admin: 1, createdAt: -1 });
adminLogSchema.index({ targetType: 1, targetId: 1 });
adminLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AdminLog', adminLogSchema);