const mongoose = require('mongoose');

const contentFlagSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    photoUrl: {
      type: String,
      required: true,
    },
    photoIndex: {
      type: Number, // which photo slot (0-3) triggered the flag
      default: 0,
    },
    flagType: {
      type: String,
      enum: ['explicit', 'suggestive', 'violence', 'gore', 'spam', 'other'],
      required: true,
    },
    confidence: {
      type: Number, // 0.0 - 1.0 score from moderation API
      default: 0,
    },
    moderationSource: {
      type: String,
      enum: ['cloudinary', 'manual'],
      default: 'cloudinary',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed_violation', 'false_positive'],
      default: 'pending',
    },
    adminNote: {
      type: String,
      default: '',
      trim: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

contentFlagSchema.index({ status: 1, createdAt: -1 });
contentFlagSchema.index({ item: 1 });
contentFlagSchema.index({ owner: 1 });

module.exports = mongoose.model('ContentFlag', contentFlagSchema);