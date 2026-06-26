const Wishlist = require('../models/Wishlist');
const Item     = require('../models/Item');

// @route   POST /api/wishlist/:itemId
// @access  Private
// Toggle: saves if not saved, unsaves if already saved
const toggleWishlist = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    // Verify item exists and is visible
    const item = await Item.findOne({
      _id:      itemId,
      status:   { $ne: 'deleted' },
      isHidden: false,
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    // Can't save your own item
    if (item.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot save your own listing.' });
    }

    const existing = await Wishlist.findOne({ user: req.user._id, item: itemId });

    if (existing) {
      await existing.deleteOne();
      return res.json({ success: true, saved: false, message: 'Removed from wishlist.' });
    }

    await Wishlist.create({ user: req.user._id, item: itemId });
    return res.status(201).json({ success: true, saved: true, message: 'Saved to wishlist! ❤️' });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const wishlistDocs = await Wishlist
      .find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'item',
        match: { status: { $ne: 'deleted' }, isHidden: false },
        populate: {
          path:   'owner',
          select: 'name avatar rating isStudentVerified',
        },
        select: 'title price isFree category photos locationName status isSold createdAt owner',
      });

    // Some items may have been deleted/hidden after saving — filter them out
    const validEntries = wishlistDocs.filter((w) => w.item !== null);

    const total = await Wishlist.countDocuments({ user: req.user._id });

    const data = validEntries.map((w) => ({
      ...w.item.toObject(),
      savedAt: w.createdAt,
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/wishlist/check/:itemId
// @access  Private
const checkWishlist = async (req, res, next) => {
  try {
    const exists = await Wishlist.findOne({
      user: req.user._id,
      item: req.params.itemId,
    });

    res.json({ success: true, saved: !!exists });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/wishlist/:itemId
// @access  Private
const removeFromWishlist = async (req, res, next) => {
  try {
    await Wishlist.findOneAndDelete({
      user: req.user._id,
      item: req.params.itemId,
    });

    res.json({ success: true, saved: false, message: 'Removed from wishlist.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { toggleWishlist, getWishlist, checkWishlist, removeFromWishlist };