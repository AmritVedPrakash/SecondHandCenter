const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const {
  getDashboardStats,
  getAllUsers, getUserDetail, banUser, unbanUser, verifyStudent, makeAdmin, revokeAdmin,
  getAllItems, getItemDetail, hideItem, showItem, deleteItem,
  getAdminLogs,
} = require('../controllers/Admin.controller');

// All routes in this file require: protect + adminOnly
router.use(protect, adminOnly);

// ── Dashboard ─────────────────────────────────────────────
router.get('/stats', getDashboardStats);

// ── Users ─────────────────────────────────────────────────
router.get   ('/users',                        getAllUsers);
router.get   ('/users/:userId',                getUserDetail);
router.patch ('/users/:userId/ban',            banUser);
router.patch ('/users/:userId/unban',          unbanUser);
router.patch ('/users/:userId/verify-student', verifyStudent);
router.patch ('/users/:userId/make-admin',     makeAdmin);
router.patch ('/users/:userId/revoke-admin',   revokeAdmin);

// ── Items ──────────────────────────────────────────────────
router.get   ('/items',          getAllItems);
router.get   ('/items/:itemId',  getItemDetail);
router.patch ('/items/:itemId/hide', hideItem);
router.patch ('/items/:itemId/show', showItem);
router.delete('/items/:itemId',  deleteItem);

// ── Audit Logs ─────────────────────────────────────────────
router.get('/logs', getAdminLogs);

module.exports = router;