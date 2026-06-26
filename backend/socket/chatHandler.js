const jwt     = require('jsonwebtoken');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const chatHandler = (io) => {
  // Socket auth middleware — verify JWT on connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error: No token'));

    try {
      const decoded  = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId  = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.userId}`);

    // Join a conversation room
    socket.on('join_conversation', ({ conversationId }) => {
      socket.join(conversationId);
      console.log(`User ${socket.userId} joined room ${conversationId}`);
    });

    // Leave a conversation room
    socket.on('leave_conversation', ({ conversationId }) => {
      socket.leave(conversationId);
    });

    // Send message via socket
    socket.on('send_message', async ({ conversationId, text }) => {
      try {
        if (!text || !text.trim()) return;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        const isParticipant =
          conversation.buyer.toString()  === socket.userId ||
          conversation.seller.toString() === socket.userId;

        if (!isParticipant) return;

        const message = await Message.create({
          conversation: conversationId,
          sender:       socket.userId,
          text:         text.trim(),
        });

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage:   text.trim(),
          lastMessageAt: new Date(),
        });

        await message.populate('sender', 'name avatar');

        io.to(conversationId).emit('new_message', message);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message.' });
      }
    });

    // Typing indicators
    socket.on('typing', ({ conversationId }) => {
      socket.to(conversationId).emit('user_typing', { userId: socket.userId });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(conversationId).emit('user_stop_typing', { userId: socket.userId });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.userId}`);
    });
  });
};

module.exports = chatHandler;
