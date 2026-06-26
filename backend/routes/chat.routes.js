const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getOrCreateConversation, getMyConversations, getConversationById,
  sendMessage, getMessages,
} = require('../controllers/chat.controller');

router.post('/conversations',              protect, getOrCreateConversation);
router.get('/conversations',               protect, getMyConversations);
router.get('/conversations/:convId',       protect, getConversationById);
router.post('/conversations/:convId/messages', protect, sendMessage);
router.get('/conversations/:convId/messages',  protect, getMessages);

module.exports = router;
