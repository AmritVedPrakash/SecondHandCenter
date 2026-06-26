const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { uploadAvatar, uploadCollegeId } = require('../config/cloudinary');
const {
  getMe, updateMe, updateAvatar, updateLocation,
  uploadCollegeId: uploadCollegeIdCtrl, getUserProfile, getUserListings,
} = require('../controllers/user.controller');

router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/me/avatar',     protect, uploadAvatar.single('avatar'), updateAvatar);
router.put('/me/location',   protect, updateLocation);
router.post('/me/college-id', protect, uploadCollegeId.single('collegeId'), uploadCollegeIdCtrl);

router.get('/:userId',          getUserProfile);
router.get('/:userId/listings', getUserListings);

module.exports = router;
