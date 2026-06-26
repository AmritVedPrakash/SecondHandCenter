const User = require('../models/User');
const Item = require('../models/Item');

// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/users/me
// @access  Private
const updateMe = async (req, res, next) => {
  try {
    const { name, phone, locationName } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, locationName },
      { new: true, runValidators: true }
    );

    res.json({ success: true, message: 'Profile updated.', data: updatedUser });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/users/me/avatar
// @access  Private
const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: req.file.path }, // Cloudinary URL
      { new: true }
    );

    res.json({ success: true, message: 'Avatar updated.', data: { avatar: updatedUser.avatar } });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/users/me/location
// @access  Private
const updateLocation = async (req, res, next) => {
  try {
    const { lat, lng, locationName } = req.body;
    const latitude = lat !== undefined && lat !== null && lat !== '' ? parseFloat(lat) : NaN;
    const longitude = lng !== undefined && lng !== null && lng !== '' ? parseFloat(lng) : NaN;

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return res.status(400).json({ success: false, message: 'Valid lat and lng are required.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        location: { type: 'Point', coordinates: [longitude, latitude] },
        locationName: locationName || 'Current location',
      },
      { new: true }
    );

    res.set('Cache-Control', 'no-store');
    res.json({
      success: true,
      message: 'Location updated.',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/users/me/college-id
// @access  Private
const uploadCollegeId = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload your college ID.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { collegeIdUrl: req.file.path, isStudentVerified: true },
      { new: true }
    );

    res.json({
      success: true,
      message: '🎓 Student badge verified!',
      data: { isStudentVerified: updatedUser.isStudentVerified, collegeIdUrl: updatedUser.collegeIdUrl },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/users/:userId
// @access  Public
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select(
      'name avatar locationName isStudentVerified rating listingsCount createdAt'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/users/:userId/listings
// @access  Public
const getUserListings = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip  = (page - 1) * limit;

    const items = await Item.find({ owner: req.params.userId, status: 'active' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title price isFree category photos isSold status createdAt locationName');

    const total = await Item.countDocuments({ owner: req.params.userId, status: 'active' });

    res.json({
      success: true,
      data: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMe, updateMe, updateAvatar, updateLocation, uploadCollegeId, getUserProfile, getUserListings };
