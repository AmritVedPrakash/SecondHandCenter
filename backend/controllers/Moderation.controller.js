const ContentFlag = require('../models/ContentFlag');
const AdminLog    = require('../models/Adminlog');
const Item        = require('../models/Item');
const User        = require('../models/User');

// How many confirmed violations before auto-ban
const AUTO_BAN_THRESHOLD = 3;

// @route   GET /api/moderation/flags
// @access  Admin
const getAllFlags = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await ContentFlag.countDocuments(filter);

    const flags = await ContentFlag.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('item',  'title photos status moderationStatus isHidden')
      .populate('owner', 'name email phone avatar isBanned')
      .populate('reviewedBy', 'name');

    // Counts for dashboard tabs
    const [pending, confirmed, dismissed] = await Promise.all([
      ContentFlag.countDocuments({ status: 'pending' }),
      ContentFlag.countDocuments({ status: 'confirmed_violation' }),
      ContentFlag.countDocuments({ status: 'false_positive' }),
    ]);

    res.json({
      success: true,
      data:    flags,
      counts:  { pending, confirmed, dismissed },
      pagination: {
        page:  parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/moderation/flags/:flagId
// @access  Admin
const getFlagById = async (req, res, next) => {
  try {
    const flag = await ContentFlag.findById(req.params.flagId)
      .populate({
        path:     'item',
        select:   'title description photos status moderationStatus moderationNote isHidden owner createdAt',
        populate: { path: 'owner', select: 'name email phone avatar listingsCount createdAt isBanned' },
      })
      .populate('owner',      'name email phone avatar listingsCount createdAt isBanned banReason')
      .populate('reviewedBy', 'name avatar');

    if (!flag) {
      return res.status(404).json({ success: false, message: 'Flag not found.' });
    }

    // Check how many previous confirmed violations this owner has
    const previousViolations = await ContentFlag.countDocuments({
      owner:  flag.owner._id,
      status: 'confirmed_violation',
    });

    res.json({
      success: true,
      data:    flag,
      ownerHistory: { previousViolations, willAutoBanAt: AUTO_BAN_THRESHOLD },
    });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/moderation/flags/:flagId
// @access  Admin
// body: { decision: 'confirmed_violation' | 'false_positive', adminNote: '' }
const resolveFlag = async (req, res, next) => {
  try {
    const { decision, adminNote = '' } = req.body;

    if (!['confirmed_violation', 'false_positive'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'decision must be "confirmed_violation" or "false_positive".',
      });
    }

    const flag = await ContentFlag.findById(req.params.flagId);
    if (!flag) {
      return res.status(404).json({ success: false, message: 'Flag not found.' });
    }

    if (flag.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Flag already reviewed.' });
    }

    if (decision === 'confirmed_violation') {
      // ── Hide and mark the item ──
      await Item.findByIdAndUpdate(flag.item, {
        moderationStatus: 'removed',
        isHidden:         true,
        moderationNote:   adminNote || 'Removed: violated content policy.',
      });

      // Decrement owner's listing count (item is now hidden)
      await User.findByIdAndUpdate(flag.owner, { $inc: { listingsCount: -1 } });

      // Log the action
      await AdminLog.create({
        admin:      req.user._id,
        action:     'confirm_content_flag',
        targetType: 'contentFlag',
        targetId:   flag._id,
        note:       adminNote,
        meta:       { itemId: flag.item, ownerId: flag.owner, flagType: flag.flagType },
      });

      // ── Auto-ban check ──
      const confirmedCount = await ContentFlag.countDocuments({
        owner:  flag.owner,
        status: 'confirmed_violation',
      });

      // +1 because we haven't saved the flag yet
      if (confirmedCount + 1 >= AUTO_BAN_THRESHOLD) {
        const user = await User.findById(flag.owner);
        if (user && !user.isBanned && !user.isAdmin) {
          user.isBanned   = true;
          user.banReason  = `Auto-banned: ${AUTO_BAN_THRESHOLD} confirmed content violations.`;
          user.bannedAt   = new Date();
          await user.save();

          await AdminLog.create({
            admin:      req.user._id,
            action:     'ban_user',
            targetType: 'user',
            targetId:   flag.owner,
            note:       `Auto-ban after ${AUTO_BAN_THRESHOLD} confirmed flags.`,
            meta:       { autoban: true },
          });
        }
      }
    } else {
      // ── False positive: restore the item ──
      const item = await Item.findById(flag.item);
      if (item) {
        item.moderationStatus = 'clean';
        item.isHidden         = false;
        item.moderationNote   = '';
        await item.save();

        // Restore listing count if item was hidden by this flag
        await User.findByIdAndUpdate(flag.owner, { $inc: { listingsCount: 1 } });
      }

      await AdminLog.create({
        admin:      req.user._id,
        action:     'dismiss_content_flag',
        targetType: 'contentFlag',
        targetId:   flag._id,
        note:       adminNote,
        meta:       { itemId: flag.item, ownerId: flag.owner },
      });
    }

    // Update flag record
    flag.status      = decision;
    flag.adminNote   = adminNote;
    flag.reviewedBy  = req.user._id;
    flag.reviewedAt  = new Date();
    await flag.save();

    res.json({
      success: true,
      message: decision === 'confirmed_violation'
        ? 'Violation confirmed. Item removed.'
        : 'Dismissed as false positive. Item restored.',
      data: flag,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllFlags, getFlagById, resolveFlag };