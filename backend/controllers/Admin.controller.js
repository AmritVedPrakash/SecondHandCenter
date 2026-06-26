const User        = require('../models/User');
const Item        = require('../models/Item');
const Report      = require('../models/Report');
const ContentFlag = require('../models/ContentFlag');
const AdminLog    = require('../models/Adminlog');

// ─── helpers ─────────────────────────────────────────────────────────────────

const startOfDay = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfWeek = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
};

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────

// @route   GET /api/admin/stats
// @access  Admin
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      bannedUsers,
      newUsersToday,
      newUsersThisWeek,
      totalItems,
      activeItems,
      soldItems,
      hiddenItems,
      newItemsToday,
      newItemsThisWeek,
      totalReports,
      pendingReports,
      pendingFlags,
      categoryBreakdown,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isBanned: true }),
      User.countDocuments({ createdAt: { $gte: startOfDay() } }),
      User.countDocuments({ createdAt: { $gte: startOfWeek() } }),
      Item.countDocuments({ status: { $ne: 'deleted' } }),
      Item.countDocuments({ status: 'active', isHidden: false }),
      Item.countDocuments({ status: 'sold' }),
      Item.countDocuments({ isHidden: true }),
      Item.countDocuments({ createdAt: { $gte: startOfDay() } }),
      Item.countDocuments({ createdAt: { $gte: startOfWeek() } }),
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      ContentFlag.countDocuments({ status: 'pending' }),
      Item.aggregate([
        { $match: { status: 'active', isHidden: false } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        users:     { total: totalUsers, banned: bannedUsers, newToday: newUsersToday, newThisWeek: newUsersThisWeek },
        items:     { total: totalItems, active: activeItems, sold: soldItems, hidden: hiddenItems, newToday: newItemsToday, newThisWeek: newItemsThisWeek },
        reports:   { total: totalReports, pending: pendingReports },
        flags:     { pending: pendingFlags },
        categoryBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── USERS ───────────────────────────────────────────────────────────────────

// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = async (req, res, next) => {
  try {
    const { search, banned, page = 1, limit = 20, sort = 'newest' } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (banned !== undefined) filter.isBanned = banned === 'true';

    const skip      = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
    const total     = await User.countDocuments(filter);

    const users = await User.find(filter)
      .select('-password')
      .sort(sortOrder)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data:    users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/admin/users/:userId
// @access  Admin
const getUserDetail = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const [user, items, reports, flags, logs] = await Promise.all([
      User.findById(userId).select('-password'),
      Item.find({ owner: userId, status: { $ne: 'deleted' } })
          .sort({ createdAt: -1 }).limit(20)
          .select('title price category status isHidden moderationStatus createdAt photos'),
      Report.find({ reporter: userId })
            .sort({ createdAt: -1 }).limit(10)
            .populate('item', 'title'),
      ContentFlag.find({ owner: userId })
                 .sort({ createdAt: -1 }).limit(10)
                 .populate('item', 'title photos'),
      AdminLog.find({ targetId: userId })
              .sort({ createdAt: -1 }).limit(10)
              .populate('admin', 'name avatar'),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, data: { user, items, reports, flags, logs } });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/admin/users/:userId/ban
// @access  Admin
const banUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason = 'Violated community guidelines.' } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Cannot ban an admin account.' });
    }

    user.isBanned  = true;
    user.banReason = reason;
    user.bannedAt  = new Date();
    await user.save();

    await AdminLog.create({
      admin:      req.user._id,
      action:     'ban_user',
      targetType: 'user',
      targetId:   userId,
      note:       reason,
    });

    res.json({ success: true, message: `User "${user.name}" has been banned.` });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/admin/users/:userId/unban
// @access  Admin
const unbanUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.isBanned  = false;
    user.banReason = '';
    user.bannedAt  = null;
    await user.save();

    await AdminLog.create({
      admin:      req.user._id,
      action:     'unban_user',
      targetType: 'user',
      targetId:   userId,
      note:       req.body.note || '',
    });

    res.json({ success: true, message: `User "${user.name}" has been unbanned.` });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/admin/users/:userId/verify-student
// @access  Admin
const verifyStudent = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isStudentVerified: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await AdminLog.create({
      admin:      req.user._id,
      action:     'verify_student',
      targetType: 'user',
      targetId:   req.params.userId,
      note:       req.body.note || 'Manually verified by admin.',
    });

    res.json({ success: true, message: 'Student badge granted.', data: { isStudentVerified: true } });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/admin/users/:userId/make-admin
// @access  Admin
const makeAdmin = async (req, res, next) => {
  try {
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You are already an admin.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isAdmin: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await AdminLog.create({
      admin:      req.user._id,
      action:     'make_admin',
      targetType: 'user',
      targetId:   req.params.userId,
      note:       req.body.note || '',
    });

    res.json({ success: true, message: `"${user.name}" is now an admin.` });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/admin/users/:userId/revoke-admin
// @access  Admin
const revokeAdmin = async (req, res, next) => {
  try {
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot revoke your own admin access.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isAdmin: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await AdminLog.create({
      admin:      req.user._id,
      action:     'revoke_admin',
      targetType: 'user',
      targetId:   req.params.userId,
      note:       req.body.note || '',
    });

    res.json({ success: true, message: `Admin access revoked for "${user.name}".` });
  } catch (error) {
    next(error);
  }
};

// ─── ITEMS ───────────────────────────────────────────────────────────────────

// @route   GET /api/admin/items
// @access  Admin
const getAllItems = async (req, res, next) => {
  try {
    const { search, status, moderationStatus, category, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (status)            filter.status            = status;
    if (moderationStatus)  filter.moderationStatus  = moderationStatus;
    if (category)          filter.category          = category;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Item.countDocuments(filter);

    const items = await Item.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('owner', 'name email avatar isBanned');

    res.json({
      success: true,
      data:    items,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/admin/items/:itemId
// @access  Admin
const getItemDetail = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.itemId)
      .populate('owner', 'name email phone avatar rating listingsCount isBanned banReason createdAt');

    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    const [flags, reports] = await Promise.all([
      ContentFlag.find({ item: item._id }).sort({ createdAt: -1 }),
      Report.find({ item: item._id }).sort({ createdAt: -1 })
            .populate('reporter', 'name email'),
    ]);

    res.json({ success: true, data: { item, flags, reports } });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/admin/items/:itemId/hide
// @access  Admin
const hideItem = async (req, res, next) => {
  try {
    const { reason = 'Hidden by admin.' } = req.body;

    const item = await Item.findById(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    item.isHidden         = true;
    item.moderationNote   = reason;
    item.moderationStatus = 'under_review';
    await item.save();

    await AdminLog.create({
      admin:      req.user._id,
      action:     'delete_item',
      targetType: 'item',
      targetId:   item._id,
      note:       reason,
    });

    res.json({ success: true, message: 'Item hidden from feed.' });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/admin/items/:itemId/show
// @access  Admin
const showItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    item.isHidden         = false;
    item.moderationStatus = 'clean';
    item.moderationNote   = '';
    await item.save();

    await AdminLog.create({
      admin:      req.user._id,
      action:     'restore_item',
      targetType: 'item',
      targetId:   item._id,
      note:       req.body.note || 'Restored by admin.',
    });

    res.json({ success: true, message: 'Item restored to feed.' });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/admin/items/:itemId
// @access  Admin
const deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    item.status   = 'deleted';
    item.isHidden = true;
    await item.save();

    // Decrement owner listing count
    await User.findByIdAndUpdate(item.owner, { $inc: { listingsCount: -1 } });

    await AdminLog.create({
      admin:      req.user._id,
      action:     'delete_item',
      targetType: 'item',
      targetId:   item._id,
      note:       req.body.reason || 'Permanently deleted by admin.',
    });

    res.json({ success: true, message: 'Item permanently deleted.' });
  } catch (error) {
    next(error);
  }
};

// ─── AUDIT LOGS ──────────────────────────────────────────────────────────────

// @route   GET /api/admin/logs
// @access  Admin
const getAdminLogs = async (req, res, next) => {
  try {
    const { action, adminId, page = 1, limit = 30 } = req.query;

    const filter = {};
    if (action)  filter.action = action;
    if (adminId) filter.admin  = adminId;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await AdminLog.countDocuments(filter);

    const logs = await AdminLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('admin', 'name avatar email');

    res.json({
      success: true,
      data:    logs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers, getUserDetail, banUser, unbanUser, verifyStudent, makeAdmin, revokeAdmin,
  getAllItems, getItemDetail, hideItem, showItem, deleteItem,
  getAdminLogs,
};