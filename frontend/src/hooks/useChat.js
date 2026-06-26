// ─────────────────────────────────────────────────────────────────────────────
//  useChat
//  High-level hook that combines chatStore + API calls + socket for ChatDetailPage.
//  Handles: loading messages, sending, real-time socket events, typing indicators.
//
//  Usage in ChatDetailPage:
//    const {
//      conversation, messages, isLoading, isSending,
//      isOtherTyping, isConnected,
//      sendMessage, handleTyping, handleStopTyping,
//    } = useChat(convId)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore }      from '../store/authStore';
import { useChatStore }      from '../store/chatStore';
import { useSocket }         from './useSocket';
import {
  getConversationById,
  getMessages as getMessagesApi,
  sendMessage  as sendMessageApi,
} from '../api/chat.api';

export function useChat(convId) {
  const { user }   = useAuthStore();
  const chatStore  = useChatStore();

  const [conversation, setConversation] = useState(null);
  const [isLoadingConv, setIsLoadingConv] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const messages      = chatStore.messagesMap[convId]  ?? [];
  const isOtherTyping = chatStore.typingMap[convId]    ?? false;
  const isLoadingMsgs = chatStore.isLoadingMessages;

  // ── Load conversation + messages on mount ─────────────────────────────────
  useEffect(() => {
    if (!convId || !user) return;

    let cancelled = false;

    const load = async () => {
      // Mark this as the active conversation
      chatStore.setActiveConversation(convId);
      chatStore.setLoadingMessages(true);

      try {
        // Load conversation details + messages in parallel
        const [convRes, msgRes] = await Promise.all([
          getConversationById(convId),
          getMessagesApi(convId),
        ]);

        if (cancelled) return;

        setConversation(convRes.data);
        chatStore.setMessages(convId, msgRes.data);
        chatStore.resetUnreadForConv(convId, user._id);
      } catch (err) {
        if (cancelled) return;
        const msg = err?.response?.data?.message || 'Failed to load conversation.';
        toast.error(msg);
      } finally {
        if (!cancelled) {
          setIsLoadingConv(false);
          chatStore.setLoadingMessages(false);
        }
      }
    };

    load();

    // Cleanup on unmount or convId change
    return () => {
      cancelled = true;
      chatStore.clearActiveConversation();
      chatStore.clearMessages(convId);
      chatStore.setTyping(convId, false);
    };
  }, [convId, user?._id]);

  // ── Socket integration ────────────────────────────────────────────────────
  const { isConnected, sendTyping, sendStopTyping } = useSocket(convId, {

    // New message arrives from socket
    onMessage: useCallback((message) => {
      chatStore.appendMessage(message, user?._id);
    }, [user?._id]),

    // Other user started typing
    onTyping: useCallback(() => {
      chatStore.setTyping(convId, true);
    }, [convId]),

    // Other user stopped typing
    onStopTyping: useCallback(() => {
      chatStore.setTyping(convId, false);
    }, [convId]),
  });

  // ── sendMessage ───────────────────────────────────────────────────────────
  // Sends a message via HTTP POST (reliable), socket delivers to other party.
  // Optimistically appends to local message list.
  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || isSending) return;

    const trimmed = text.trim();
    setIsSending(true);

    try {
      const { data: message } = await sendMessageApi(convId, trimmed);

      // Optimistically add to local list
      chatStore.appendSentMessage(convId, message);

      // Update sidebar preview
      const isBuyer = conversation?.buyer?._id === user?._id;
      chatStore.updateConversationLastMessage(convId, trimmed, true, isBuyer);

      // Stop typing indicator when message is sent
      sendStopTyping();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  }, [convId, isSending, conversation, user?._id, sendStopTyping]);

  // ── Typing handlers (for ChatInput) ──────────────────────────────────────
  const typingTimerRef = useRef(null);

  const handleTyping = useCallback(() => {
    sendTyping();
    // Auto stop-typing after 2 seconds of inactivity
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      sendStopTyping();
    }, 2000);
  }, [sendTyping, sendStopTyping]);

  const handleStopTyping = useCallback(() => {
    clearTimeout(typingTimerRef.current);
    sendStopTyping();
  }, [sendStopTyping]);

  // ── Determine "other" user from conversation ──────────────────────────────
  const otherUser = conversation
    ? (conversation.buyer?._id === user?._id ? conversation.seller : conversation.buyer)
    : null;

  const isBuyer = conversation?.buyer?._id === user?._id;

  return {
    // ── Data ──
    conversation,
    messages,
    otherUser,
    isBuyer,

    // ── Loading states ──
    isLoading:    isLoadingConv || isLoadingMsgs,
    isSending,
    isConnected,

    // ── Typing ──
    isOtherTyping,

    // ── Actions ──
    sendMessage,
    handleTyping,
    handleStopTyping,
  };
}
