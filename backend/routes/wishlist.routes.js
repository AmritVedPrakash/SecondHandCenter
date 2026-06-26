const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  toggleWishlist,
  getWishlist,
  checkWishlist,
  removeFromWishlist,
} = require('../controllers/Wishlist.controller');

// NOTE: /check/:itemId must come BEFORE /:itemId to avoid route conflict
router.get   ('/check/:itemId', protect, checkWishlist);
router.get   ('/',              protect, getWishlist);
router.post  ('/:itemId',       protect, toggleWishlist);
router.delete('/:itemId',       protect, removeFromWishlist);

module.exports = router;
