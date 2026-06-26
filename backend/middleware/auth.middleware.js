const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes — must be logged in
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    // ─── NEW: block banned users from all protected routes ───
    if (req.user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Contact support.',
        reason:  req.user.banReason || '',
      });
    }
    // ─────────────────────────────────────────────────────────

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized. Invalid token.' });
  }
};

// Admin only
const adminOnly = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
  }
  next();
};

module.exports = { protect, adminOnly };
