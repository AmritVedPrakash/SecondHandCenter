const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Electronics', 'Furniture', 'Books', 'Clothes', 'Farm Tools', 'Other'],
    },
    photos: {
      type: [String],
      validate: {
        validator: (v) => v.length <= 4,
        message: 'Maximum 4 photos allowed',
      },
      default: [],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    locationName: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'sold', 'deleted'],
      default: 'active',
    },
    isSold: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },

    // ─── NEW FIELDS ───────────────────────────────────────
    moderationStatus: {
      type: String,
      enum: ['clean', 'flagged', 'under_review', 'removed'],
      default: 'clean',
    },
    moderationNote: {
      type: String,
      default: '',
      trim: true,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
    // ─────────────────────────────────────────────────────
  },
  { timestamps: true }
);

itemSchema.index({ location: '2dsphere' });
itemSchema.index({ title: 'text', description: 'text' });
itemSchema.index({ category: 1, status: 1 });
itemSchema.index({ owner: 1, status: 1 });
itemSchema.index({ isHidden: 1, status: 1 }); // NEW

itemSchema.pre('save', function (next) {
  this.isFree = this.price === 0;
  next();
});

module.exports = mongoose.model('Item', itemSchema);
