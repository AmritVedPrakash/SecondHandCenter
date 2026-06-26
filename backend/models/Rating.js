const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    rater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ratee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    stars: {
      type: Number,
      required: true,
      min: [1, 'Minimum 1 star'],
      max: [5, 'Maximum 5 stars'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment too long'],
      default: '',
    },
  },
  { timestamps: true }
);

// One rating per rater per item
ratingSchema.index({ rater: 1, item: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
