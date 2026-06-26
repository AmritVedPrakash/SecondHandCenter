const Report = require('../models/Report');

// @route   POST /api/reports
// @access  Private
const createReport = async (req, res, next) => {
  try {
    const { itemId, reason } = req.body;

    if (!itemId || !reason) {
      return res.status(400).json({ success: false, message: 'itemId and reason are required.' });
    }

    const existing = await Report.findOne({ reporter: req.user._id, item: itemId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already reported this item.' });
    }

    const report = await Report.create({
      reporter: req.user._id,
      item:     itemId,
      reason:   reason.trim(),
    });

    res.status(201).json({ success: true, message: 'Report submitted. We will review it shortly.', data: report });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/reports
// @access  Admin only
const getAllReports = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip    = (parseInt(page) - 1) * parseInt(limit);
    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reporter', 'name email')
      .populate('item',     'title status');

    const total = await Report.countDocuments(filter);

    res.json({ success: true, data: reports, pagination: { page: parseInt(page), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/reports/:reportId
// @access  Admin only
const updateReportStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be: pending, reviewed, or resolved.' });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.reportId,
      { status },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    res.json({ success: true, message: 'Report status updated.', data: report });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReport, getAllReports, updateReportStatus };
