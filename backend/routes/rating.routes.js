const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { createRating, getUserRatings } = require('../controllers/rating.controller');

router.post('/',              protect, createRating);
router.get('/user/:userId',   getUserRatings);

module.exports = router;
