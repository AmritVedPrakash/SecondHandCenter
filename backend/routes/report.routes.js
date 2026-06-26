const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { createReport, getAllReports, updateReportStatus } = require('../controllers/report.controller');

router.post('/',              protect, createReport);
router.get('/',               protect, adminOnly, getAllReports);
router.patch('/:reportId',    protect, adminOnly, updateReportStatus);

module.exports = router;
