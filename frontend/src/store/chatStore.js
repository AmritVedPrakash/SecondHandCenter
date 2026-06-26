// ─────────────────────────────────────────────────────────────────────────────
//  BazaarBuddy — Chat Store
//  Manages: active conversation, total unread count, real-time message cache
//
//  Does NOT persist — chat state is always fresh from API.
//
//  How this store is used:
//    - ChatDetailPage sets activeConversationId on mount, clears on unmount
//    - Navbar reads totalUnread to show badge on chat icon
//    - ChatDetailPage appends incoming socket messages to messagesMap
//    - ConversationList reads conversations[] for the sidebar
//
//  Socket events that trigger store updates (from useSocket hook):
//    "new_message"        → appendMessage()
//    "user_typing"        → setTyping(convId, true)
//    "user_stop_typing"   → setTyping(convId, false)
//
//  Usage anywhere in the app:
//    import { useChatStore } from '@/store/chatStore'
//    const { totalUnread, activeConversationId } = useChatStore()
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';

// ── Store definition ──────────────────────────────────────────────────────────
const useChatStore = create((set, get) => ({

  // ── State ────────────────────────────────────────────────────────────────

  // _id of the conversation currently open in ChatDetailPage.
  // null when not in a chat.
  activeConversationId: null,

  // Total unread messages count across ALL conversations.
  // Shown as badge on chat icon in Navbar.
  // Computed from conversations[] when fetched, updated in real-time via socket.
  totalUnread: 0,

  // All conversations list — populated when ChatListPage or ChatDetailPage loads.
  // Shape: Conversation[] (same as GET /api/chat/conversations response)
  conversations: [],

  // Map of conversationId → Message[]
  // Populated when ChatDetailPage opens a conversation.
  // New messages from socket are appended here.
  // Key: conversationId string, Value: Message[]
  messagesMap: {},

  // Map of conversationId → boolean (is the other user typing?)
  // Set by socket "user_typing" / "user_stop_typing" events.
  typingMap: {},

  // True while loading conversations list
  isLoadingConversations: false,

  // True while loading messages for active conversation
  isLoadingMessages: false,

  // ── Actions ──────────────────────────────────────────────────────────────

  // ── setActiveConversation ────────────────────────────────────────────────
  // Called in ChatDetailPage on mount.
  // Sets the active conv and resets unread for it (optimistic).
  setActiveConversation: (convId) =>
    set((state) => ({
      activeConversationId: convId,
      // Optimistically reset unread for this conversation
      conversations: state.conversations.map((c) =>
        c._id === convId ? { ...c, buyerUnread: 0, sellerUnread: 0 } : c
      ),
    })),

  // ── clearActiveConversation ──────────────────────────────────────────────
  // Called in ChatDetailPage on unmount / when user leaves chat.
  clearActiveConversation: () =>
    set({ activeConversationId: null }),

  // ── setConversations ─────────────────────────────────────────────────────
  // Called after GET /api/chat/conversations succeeds.
  // Also recalculates totalUnread from the fresh data.
  //
  // currentUserId is needed to figure out which unread field applies to us.
  setConversations: (conversations, currentUserId) => {
    const totalUnread = conversations.reduce((sum, conv) => {
      const isBuyer = conv.buyer?._id === currentUserId || conv.buyer === currentUserId;
      return sum + (isBuyer ? (conv.buyerUnread || 0) : (conv.sellerUnread || 0));
    }, 0);

    set({ conversations, totalUnread, isLoadingConversations: false });
  },

  // ── prependConversation ──────────────────────────────────────────────────
  // Called after getOrCreateConversation — adds new conv to top of list
  // (or moves existing one to top if already present).
  prependConversation: (conv) =>
    set((state) => {
      const filtered = state.conversations.filter((c) => c._id !== conv._id);
      return { conversations: [conv, ...filtered] };
    }),

  // ── updateConversationLastMessage ────────────────────────────────────────
  // Called after sendMessage succeeds — updates lastMessage preview in sidebar.
  // Also moves conversation to top (re-sort by lastMessageAt).
  updateConversationLastMessage: (convId, text, incrementOtherUnread = false, isBuyer = false) =>
    set((state) => {
      const updated = state.conversations.map((c) => {
        if (c._id !== convId) return c;
        return {
          ...c,
          lastMessage:   text,
          lastMessageAt: new Date().toISOString(),
          // If we sent the message, increment the OTHER person's unread
          ...(incrementOtherUnread && isBuyer  && { sellerUnread: (c.sellerUnread || 0) + 1 }),
          ...(incrementOtherUnread && !isBuyer && { buyerUnread:  (c.buyerUnread  || 0) + 1 }),
        };
      });
      // Move updated conversation to top
      const target = updated.find((c) => c._id === convId);
      const rest   = updated.filter((c) => c._id !== convId);
      return { conversations: target ? [target, ...rest] : updated };
    }),

  // ── setMessages ──────────────────────────────────────────────────────────
  // Called after GET /api/chat/conversations/:convId/messages succeeds.
  // Replaces all messages for this conversation.
  setMessages: (convId, messages) =>
    set((state) => ({
      messagesMap:       { ...state.messagesMap, [convId]: messages },
      isLoadingMessages: false,
    })),

  // ── appendMessage ────────────────────────────────────────────────────────
  // Called when socket emits "new_message".
  // Appends incoming message to the correct conversation's message list.
  // Also updates lastMessage preview in conversations sidebar.
  // Also increments totalUnread if this conv is NOT the active one.
  //
  // message shape: { _id, text, createdAt, sender: { _id, name, avatar }, conversation, isRead }
  appendMessage: (message, currentUserId) =>
    set((state) => {
      const convId   = message.conversation?.toString() || message.conversation;
      const existing = state.messagesMap[convId] || [];

      // Avoid duplicates (in case HTTP POST and socket deliver same message)
      if (existing.some((m) => m._id === message._id)) return state;

      const isFromMe     = message.sender?._id === currentUserId || message.sender === currentUserId;
      const isActiveConv = state.activeConversationId === convId;

      // Increment totalUnread only for incoming messages in background convs
      const unreadDelta = (!isFromMe && !isActiveConv) ? 1 : 0;

      return {
        messagesMap: {
          ...state.messagesMap,
          [convId]: [...existing, message],
        },
        totalUnread: state.totalUnread + unreadDelta,
        // Update lastMessage in conv list
        conversations: state.conversations.map((c) =>
          c._id === convId
            ? { ...c, lastMessage: message.text, lastMessageAt: message.createdAt }
            : c
        ),
      };
    }),

  // ── appendSentMessage ────────────────────────────────────────────────────
  // Called immediately after HTTP sendMessage succeeds (before socket echo).
  // Adds the sent message to the local messages list optimistically.
  appendSentMessage: (convId, message) =>
    set((state) => {
      const existing = state.messagesMap[convId] || [];
      if (existing.some((m) => m._id === message._id)) return state;
      return {
        messagesMap: {
          ...state.messagesMap,
          [convId]: [...existing, message],
        },
      };
    }),

  // ── setTyping ────────────────────────────────────────────────────────────
  // Called by useSocket when "user_typing" or "user_stop_typing" fires.
  // isTyping: true = show TypingIndicator, false = hide it
  setTyping: (convId, isTyping) =>
    set((state) => ({
      typingMap: { ...state.typingMap, [convId]: isTyping },
    })),

  // ── clearMessages ────────────────────────────────────────────────────────
  // Free memory when leaving a conversation (called on ChatDetailPage unmount).
  clearMessages: (convId) =>
    set((state) => {
      const next = { ...state.messagesMap };
      delete next[convId];
      return { messagesMap: next };
    }),

  // ── setTotalUnread ───────────────────────────────────────────────────────
  // Set absolute unread count (e.g. after marking messages as read via API).
  setTotalUnread: (count) => set({ totalUnread: Math.max(0, count) }),

  // ── resetUnreadForConv ───────────────────────────────────────────────────
  // Called when user opens a conversation — marks it as read locally.
  // currentUserId needed to know which field to reset (buyer or seller).
  resetUnreadForConv: (convId, currentUserId) =>
    set((state) => {
      const updated = state.conversations.map((c) => {
        if (c._id !== convId) return c;
        const isBuyer = c.buyer?._id === currentUserId || c.buyer === currentUserId;
        const prevUnread = isBuyer ? (c.buyerUnread || 0) : (c.sellerUnread || 0);
        return {
          ...c,
          buyerUnread:  isBuyer  ? 0 : c.buyerUnread,
          sellerUnread: !isBuyer ? 0 : c.sellerUnread,
        };
      });

      // Recalculate totalUnread
      const totalUnread = updated.reduce((sum, c) => {
        const isBuyer = c.buyer?._id === currentUserId || c.buyer === currentUserId;
        return sum + (isBuyer ? (c.buyerUnread || 0) : (c.sellerUnread || 0));
      }, 0);

      return { conversations: updated, totalUnread };
    }),

  // ── setLoadingConversations ──────────────────────────────────────────────
  setLoadingConversations: (bool) => set({ isLoadingConversations: bool }),

  // ── setLoadingMessages ───────────────────────────────────────────────────
  setLoadingMessages: (bool) => set({ isLoadingMessages: bool }),

  // ── reset ────────────────────────────────────────────────────────────────
  // Clear ALL chat state — called on logout.
  reset: () =>
    set({
      activeConversationId:   null,
      totalUnread:            0,
      conversations:          [],
      messagesMap:            {},
      typingMap:              {},
      isLoadingConversations: false,
      isLoadingMessages:      false,
    }),
}));

export { useChatStore };
