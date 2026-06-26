const Conversation = require('../models/Conversation');
const Message      = require('../models/Message');
const Item         = require('../models/Item');

// @route   POST /api/chat/conversations
// @access  Private
const getOrCreateConversation = async (req, res, next) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ success: false, message: 'itemId is required.' });
    }

    const item = await Item.findById(itemId);
    if (!item || item.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    if (item.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot chat with yourself.' });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({ item: itemId, buyer: req.user._id });

    if (!conversation) {
      conversation = await Conversation.create({
        item:   itemId,
        buyer:  req.user._id,
        seller: item.owner,
      });
    }

    await conversation.populate([
      { path: 'item',   select: 'title photos price isFree status' },
      { path: 'buyer',  select: 'name avatar' },
      { path: 'seller', select: 'name avatar phone' },
    ]);

    res.status(201).json({ success: true, data: conversation });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/chat/conversations
// @access  Private
const getMyConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      $or: [{ buyer: req.user._id }, { seller: req.user._id }],
    })
      .sort({ lastMessageAt: -1 })
      .populate('item',   'title photos price isFree status')
      .populate('buyer',  'name avatar')
      .populate('seller', 'name avatar');

    res.json({ success: true, data: conversations });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/chat/conversations/:convId
// @access  Private
const getConversationById = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.convId)
      .populate('item',   'title photos price isFree status locationName')
      .populate('buyer',  'name avatar')
      .populate('seller', 'name avatar phone');

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    // Only buyer or seller can view
    const isParticipant =
      conversation.buyer._id.toString()  === req.user._id.toString() ||
      conversation.seller._id.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: conversation });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/chat/conversations/:convId/messages
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required.' });
    }

    const conversation = await Conversation.findById(req.params.convId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const isParticipant =
      conversation.buyer.toString()  === req.user._id.toString() ||
      conversation.seller.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender:       req.user._id,
      text:         text.trim(),
    });

    // Update conversation last message
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage:   text.trim(),
      lastMessageAt: new Date(),
      ...(conversation.buyer.toString() === req.user._id.toString()
        ? { $inc: { sellerUnread: 1 } }
        : { $inc: { buyerUnread: 1 } }),
    });

    await message.populate('sender', 'name avatar');

    // Emit via socket if available
    const io = req.app.get('io');
    if (io) {
      io.to(conversation._id.toString()).emit('new_message', message);
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/chat/conversations/:convId/messages
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.convId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const isParticipant =
      conversation.buyer.toString()  === req.user._id.toString() ||
      conversation.seller.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip  = (page - 1) * limit;

    const messages = await Message.find({ conversation: req.params.convId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name avatar');

    // Mark messages as read
    await Message.updateMany(
      { conversation: req.params.convId, sender: { $ne: req.user._id }, isRead: false },
      { isRead: true }
    );

    // Reset unread count
    const isBuyer = conversation.buyer.toString() === req.user._id.toString();
    await Conversation.findByIdAndUpdate(req.params.convId, {
      [isBuyer ? 'buyerUnread' : 'sellerUnread']: 0,
    });

    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

module.exports = { getOrCreateConversation, getMyConversations, getConversationById, sendMessage, getMessages };
