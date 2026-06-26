// ─────────────────────────────────────────────────────────────────────────────
//  useSocket
//  Manages a Socket.io connection for a specific conversation.
//  Handles: join room, leave room, receive messages, typing indicators.
//
//  Used in: ChatDetailPage
//
//  Socket auth: JWT token passed in handshake.auth.token
//  Backend verifies it in chatHandler.js middleware.
//
//  Events this hook LISTENS for (from server → client):
//    "new_message"        → payload: Message object (populated sender)
//    "user_typing"        → payload: { userId }
//    "user_stop_typing"   → payload: { userId }
//
//  Events this hook EMITS (client → server):
//    "join_conversation"  → payload: { conversationId }
//    "leave_conversation" → payload: { conversationId }
//    "typing"             → payload: { conversationId }
//    "stop_typing"        → payload: { conversationId }
//
//  Usage:
//    const { sendTyping, sendStopTyping, isConnected } = useSocket(convId, {
//      onMessage:    (msg) => chatStore.appendMessage(msg, user._id),
//      onTyping:     ()    => setOtherTyping(true),
//      onStopTyping: ()    => setOtherTyping(false),
//    })
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function useSocket(conversationId, { onMessage, onTyping, onStopTyping } = {}) {
  const socketRef     = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  // Keep callback refs fresh so useEffect doesn't need to re-run on callback change
  const onMessageRef    = useRef(onMessage);
  const onTypingRef     = useRef(onTyping);
  const onStopTypingRef = useRef(onStopTyping);

  useEffect(() => { onMessageRef.current    = onMessage;    }, [onMessage]);
  useEffect(() => { onTypingRef.current     = onTyping;     }, [onTyping]);
  useEffect(() => { onStopTypingRef.current = onStopTyping; }, [onStopTyping]);

  useEffect(() => {
    if (!conversationId) return;

    const token = localStorage.getItem('bb_token');
    if (!token) return; // not logged in — no socket

    // ── Create connection ────────────────────────────────────────────────────
    socketRef.current = io(SOCKET_URL, {
      auth:       { token },         // JWT → chatHandler.js verifies this
      transports: ['websocket'],     // skip polling for speed
      reconnection:        true,
      reconnectionAttempts: 5,
      reconnectionDelay:   1000,
    });

    const socket = socketRef.current;

    // ── Connection events ────────────────────────────────────────────────────
    socket.on('connect', () => {
      setIsConnected(true);
      // Join the conversation room after connecting
      socket.emit('join_conversation', { conversationId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      setIsConnected(false);
    });

    // ── Message events ───────────────────────────────────────────────────────
    // "new_message" fires for EVERYONE in the room (including the sender,
    //  since HTTP POST already handles the sender's local append,
    //  we check in appendMessage() for duplicates).
    socket.on('new_message', (message) => {
      onMessageRef.current?.(message);
    });

    // ── Typing events ─────────────────────────────────────────────────────────
    // "user_typing" only fires to OTHER participants in the room (not the typer).
    socket.on('user_typing', (data) => {
      onTypingRef.current?.(data);
    });

    socket.on('user_stop_typing', (data) => {
      onStopTypingRef.current?.(data);
    });

    // ── Error from server ─────────────────────────────────────────────────────
    socket.on('error', (err) => {
      console.error('[Socket] Server error:', err.message);
    });

    // ── Cleanup on unmount / conversationId change ────────────────────────────
    return () => {
      if (socket.connected) {
        socket.emit('leave_conversation', { conversationId });
      }
      socket.disconnect();
      setIsConnected(false);
    };
  }, [conversationId]); // only re-run if conversationId changes

  // ── sendTyping ─────────────────────────────────────────────────────────────
  // Emit "typing" event to server.
  // Server broadcasts "user_typing" to all OTHER participants.
  // Call this while user is typing in ChatInput.
  const sendTyping = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing', { conversationId });
    }
  }, [conversationId]);

  // ── sendStopTyping ─────────────────────────────────────────────────────────
  // Emit "stop_typing" event. Call after inactivity (1.5s debounce in ChatInput).
  const sendStopTyping = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('stop_typing', { conversationId });
    }
  }, [conversationId]);

  return {
    isConnected,
    sendTyping,
    sendStopTyping,
  };
}
