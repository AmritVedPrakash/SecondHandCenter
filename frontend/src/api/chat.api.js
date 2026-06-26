// ─────────────────────────────────────────────────────────────────────────────
//  BazaarBuddy — Chat API
//  Routes:
//    POST /api/chat/conversations                          — get or create
//    GET  /api/chat/conversations                          — my conversations
//    GET  /api/chat/conversations/:convId                  — single conversation
//    POST /api/chat/conversations/:convId/messages         — send message (HTTP)
//    GET  /api/chat/conversations/:convId/messages         — load messages
//
//  Note: Real-time delivery uses Socket.io (see useSocket.js in hooks).
//        HTTP POST /messages is used for reliability; socket delivers to other party.
// ─────────────────────────────────────────────────────────────────────────────

import api from './axios';

// ─────────────────────────────────────────────────────────────────────────────
//  GET OR CREATE CONVERSATION
//  POST /api/chat/conversations   (requires auth)
//
//  Request body:
//    { itemId: string }
//
//  Behavior:
//    - Logged-in user becomes "buyer"
//    - Item owner becomes "seller"
//    - If conversation already exists for this buyer+item pair → returns existing
//    - If new → creates a new conversation
//
//  Success 201:
//    {
//      success: true,
//      data: {
//        _id, createdAt, updatedAt,
//        lastMessage: "",  lastMessageAt,
//        buyerUnread: 0,   sellerUnread: 0,
//        item:   { _id, title, photos[], price, isFree, status },
//        buyer:  { _id, name, avatar },
//        seller: { _id, name, avatar, phone }
//      }
//    }
//
//  Errors:
//    400 — "itemId is required."
//    400 — "You cannot chat with yourself."
//    404 — "Item not found."
//
//  Usage: Call this when user clicks "Message Seller" on item detail page.
//         Then navigate to /chat/:data._id
// ─────────────────────────────────────────────────────────────────────────────
export const getOrCreateConversation = (itemId) =>
  api.post('/chat/conversations', { itemId }).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
//  GET MY CONVERSATIONS
//  GET /api/chat/conversations   (requires auth)
//
//  Returns all conversations where current user is buyer OR seller.
//  Sorted by lastMessageAt descending (most recent first).
//
//  Success 200:
//    {
//      success: true,
//      data: Conversation[]
//    }
//
//  Conversation shape:
//    {
//      _id, lastMessage: string, lastMessageAt: date,
//      buyerUnread: number,  sellerUnread: number,
//      item:   { _id, title, photos[], price, isFree, status },
//      buyer:  { _id, name, avatar },
//      seller: { _id, name, avatar }
//    }
//
//  To determine unread count for current user:
//    if (currentUser._id === conv.buyer._id)  → unread = conv.buyerUnread
//    if (currentUser._id === conv.seller._id) → unread = conv.sellerUnread
//
//  To determine "other" user:
//    if (currentUser._id === conv.buyer._id)  → other = conv.seller
//    if (currentUser._id === conv.seller._id) → other = conv.buyer
// ─────────────────────────────────────────────────────────────────────────────
export const getMyConversations = () =>
  api.get('/chat/conversations').then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
//  GET SINGLE CONVERSATION
//  GET /api/chat/conversations/:convId   (requires auth, participant only)
//
//  Success 200:
//    {
//      success: true,
//      data: {
//        _id, lastMessage, lastMessageAt, buyerUnread, sellerUnread,
//        item:   { _id, title, photos[], price, isFree, status, locationName },
//        buyer:  { _id, name, avatar },
//        seller: { _id, name, avatar, phone }  // phone included here
//      }
//    }
//
//  Errors:
//    403 — "Access denied."  (not a participant)
//    404 — "Conversation not found."
// ─────────────────────────────────────────────────────────────────────────────
export const getConversationById = (convId) =>
  api.get(`/chat/conversations/${convId}`).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
//  SEND MESSAGE (via HTTP — more reliable than socket-only)
//  POST /api/chat/conversations/:convId/messages   (requires auth, participant only)
//
//  Request body:
//    { text: string }  (max 1000 chars)
//
//  Side effects:
//    - Updates conversation.lastMessage + lastMessageAt
//    - Increments unread count for the OTHER participant
//      (if sender is buyer → sellerUnread++, and vice versa)
//    - Emits socket event "new_message" to conversation room for real-time delivery
//
//  Success 201:
//    {
//      success: true,
//      data: {
//        _id, conversation: convId, text, isRead: false, createdAt,
//        sender: { _id, name, avatar }
//      }
//    }
//
//  Errors:
//    400 — "Message text is required."
//    403 — "Access denied."
//    404 — "Conversation not found."
// ─────────────────────────────────────────────────────────────────────────────
export const sendMessage = (convId, text) =>
  api.post(`/chat/conversations/${convId}/messages`, { text }).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
//  GET MESSAGES
//  GET /api/chat/conversations/:convId/messages   (requires auth, participant only)
//
//  Query params (optional):
//    page  (default 1)
//    limit (default 50)
//
//  Side effects:
//    - Marks all INCOMING messages (sent by other user) as isRead = true
//    - Resets current user's unread count to 0 in conversation
//
//  Success 200:
//    {
//      success: true,
//      data: Message[]   // sorted createdAt ascending (oldest first)
//    }
//
//  Message shape:
//    {
//      _id, text, isRead, createdAt,
//      conversation: convId,
//      sender: { _id, name, avatar }
//    }
//
//  To check if message is mine:
//    const isMine = msg.sender._id === currentUser._id
//
//  Errors:
//    403 — "Access denied."
//    404 — "Conversation not found."
// ─────────────────────────────────────────────────────────────────────────────
export const getMessages = (convId, params = {}) =>
  api.get(`/chat/conversations/${convId}/messages`, { params }).then((r) => r.data);
