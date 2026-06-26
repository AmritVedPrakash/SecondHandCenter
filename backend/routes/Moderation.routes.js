const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { getAllFlags, getFlagById, resolveFlag } = require('../controllers/Moderation.controller');

// All routes require: protect + adminOnly
router.use(protect, adminOnly);

router.get  ('/',         getAllFlags);
router.get  ('/:flagId',  getFlagById);
router.patch('/:flagId',  resolveFlag);

module.exports = router;