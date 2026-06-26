const Rating = require('../models/Rating');
const User   = require('../models/User');

// @route   POST /api/ratings
// @access  Private
const createRating = async (req, res, next) => {
  try {
    const { rateeId, itemId, stars, comment } = req.body;

    if (!rateeId || !itemId || !stars) {
      return res.status(400).json({ success: false, message: 'rateeId, itemId, and stars are required.' });
    }

    if (rateeId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot rate yourself.' });
    }

    // Check if already rated
    const existingRating = await Rating.findOne({ rater: req.user._id, item: itemId });
    if (existingRating) {
      return res.status(400).json({ success: false, message: 'You have already rated this transaction.' });
    }

    const rating = await Rating.create({
      rater:   req.user._id,
      ratee:   rateeId,
      item:    itemId,
      stars:   parseInt(stars),
      comment: comment || '',
    });

    // Recalculate seller's average rating
    const allRatings = await Rating.find({ ratee: rateeId });
    const avg = allRatings.reduce((sum, r) => sum + r.stars, 0) / allRatings.length;

    await User.findByIdAndUpdate(rateeId, {
      'rating.average': Math.round(avg * 10) / 10,
      'rating.count':   allRatings.length,
    });

    res.status(201).json({ success: true, message: 'Rating submitted!', data: rating });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/ratings/user/:userId
// @access  Public
const getUserRatings = async (req, res, next) => {
  try {
    const ratings = await Rating.find({ ratee: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('rater', 'name avatar')
      .populate('item',  'title');

    res.json({ success: true, data: ratings, count: ratings.length });
  } catch (error) {
    next(error);
  }
};

module.exports = { createRating, getUserRatings };
