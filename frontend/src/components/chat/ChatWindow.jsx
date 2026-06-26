// ─────────────────────────────────────────────────────────────────────────────
//  ChatWindow  |  Full chat UI — item card + messages + input
//
//  Uses useChat hook which internally uses useSocket.
//  Renders: item info bar → messages list → typing indicator → chat input
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore }  from '../../store/authStore';
import { useChat }       from '../../hooks/useChat';
import MessageBubble     from './MessageBubble';
import TypingIndicator   from './TypingIndicator';
import ChatInput         from './ChatInput';
import UserAvatarDef     from '../user/UserAvatar';
import { PageSpinner }   from '../ui/Spinner';
import EmptyState        from '../ui/EmptyState';

// ── Item info bar at top of chat ──────────────────────────────────────────────
function ItemBar({ item }) {
  if (!item) return null;
  const photo = item.photos?.[0];
  const price = item.isFree ? 'FREE'
    : new Intl.NumberFormat('en-IN',{ style:'currency', currency:'INR', maximumFractionDigits:0 }).format(item.price);

  return (
    <Link
      to={`/items/${item._id}`}
      className="flex items-center gap-3 px-4 py-3 bg-cream-50 border-b border-cream-200 hover:bg-cream-100 transition-colors group"
    >
      <div className="w-10 h-10 rounded-xl overflow-hidden bg-cream-100 flex-shrink-0 border border-cream-200">
        {photo
          ? <img src={photo} alt={item.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-charcoal-800 truncate group-hover:text-primary-600 transition-colors">
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs font-bold ${item.isFree ? 'text-forest-600' : 'text-primary-600'}`}>
            {price}
          </span>
          {item.status === 'sold' && (
            <span className="badge-sold text-[10px] !px-1.5">Sold</span>
          )}
        </div>
      </div>
      <svg className="w-4 h-4 text-cream-400 group-hover:text-primary-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

// ── Date separator ────────────────────────────────────────────────────────────
function DateSep({ date }) {
  const label = (() => {
    const d   = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
  })();
  return (
    <div className="flex items-center gap-3 px-4 py-1">
      <div className="flex-1 h-px bg-cream-200" />
      <span className="text-[11px] text-cream-400 font-semibold whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-cream-200" />
    </div>
  );
}

// ── Group messages by date ────────────────────────────────────────────────────
function groupByDate(messages) {
  const groups = [];
  let lastDate = null;
  for (const msg of messages) {
    const d = new Date(msg.createdAt).toDateString();
    if (d !== lastDate) { groups.push({ type:'date', date: msg.createdAt, id:`date-${msg._id}` }); lastDate = d; }
    groups.push({ type:'message', msg });
  }
  return groups;
}

// ── Main ChatWindow ───────────────────────────────────────────────────────────
export default function ChatWindow({ convId }) {
  const { user } = useAuthStore();
  const {
    conversation, messages, otherUser,
    isLoading, isSending, isOtherTyping,
    sendMessage, handleTyping, handleStopTyping,
  } = useChat(convId);

  const bottomRef   = useRef(null);
  const prevMsgLen  = useRef(0);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > prevMsgLen.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMsgLen.current = messages.length;
  }, [messages.length]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
    }
  }, [isLoading]);

  if (isLoading) return <PageSpinner label="Loading conversation…" />;

  const grouped = groupByDate(messages);

  return (
    <div className="flex flex-col h-full bg-cream-50">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-cream-200 flex-shrink-0 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <Link to="/chat" className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center text-cream-500 hover:text-charcoal-800 hover:bg-cream-100 transition-all -ml-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <Link to={`/profile/${otherUser?._id}`} className="flex items-center gap-3 flex-1 min-w-0 group">
          <UserAvatarDef user={otherUser} size="md" showBadge />
          <div className="min-w-0">
            <p className="text-sm font-bold text-charcoal-800 group-hover:text-primary-600 transition-colors truncate">
              {otherUser?.name || 'Loading…'}
            </p>
            <p className="text-xs text-cream-400 font-medium">
              {isOtherTyping ? (
                <span className="text-forest-600 font-semibold">typing…</span>
              ) : (
                'Tap to view profile'
              )}
            </p>
          </div>
        </Link>

        {/* Item mini-card on header (mobile) */}
        {conversation?.item && (
          <Link
            to={`/items/${conversation.item._id}`}
            className="hidden sm:flex items-center gap-2 bg-cream-100 border border-cream-200 rounded-xl px-3 py-1.5 hover:bg-cream-200 transition-colors max-w-[160px]"
          >
            {conversation.item.photos?.[0] && (
              <img src={conversation.item.photos[0]} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
            )}
            <p className="text-xs font-semibold text-charcoal-800 truncate">{conversation.item.title}</p>
          </Link>
        )}
      </div>

      {/* ── Item bar ── */}
      <ItemBar item={conversation?.item} />

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto chat-scroll py-4 space-y-2">
        {messages.length === 0 ? (
          <EmptyState
            icon="👋"
            title={`Say hello to ${otherUser?.name || 'them'}!`}
            description="This is the beginning of your conversation."
            compact
          />
        ) : (
          <>
            {grouped.map((item, idx) => {
              if (item.type === 'date') {
                return <DateSep key={item.id} date={item.date} />;
              }
              const msg    = item.msg;
              const isMine = msg.sender?._id === user?._id || msg.sender === user?._id;
              // Show avatar only for first message in a sequence from same sender
              const nextItem = grouped[idx + 1];
              const nextMsg  = nextItem?.type === 'message' ? nextItem.msg : null;
              const nextIsSameSender = nextMsg
                ? (nextMsg.sender?._id === msg.sender?._id || nextMsg.sender === msg.sender)
                : false;
              const showAvatar = !isMine && !nextIsSameSender;

              return (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  isMine={isMine}
                  showAvatar={showAvatar}
                />
              );
            })}

            {/* Typing indicator */}
            <TypingIndicator isVisible={isOtherTyping} userName={otherUser?.name} />

            <div ref={bottomRef} className="h-px" />
          </>
        )}
      </div>

      {/* ── Input ── */}
      <ChatInput
        onSend={sendMessage}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
        sending={isSending}
        disabled={conversation?.item?.status === 'deleted'}
        placeholder={
          conversation?.item?.status === 'deleted'
            ? 'This item is no longer available'
            : `Message ${otherUser?.name || 'seller'}…`
        }
      />
    </div>
  );
}
