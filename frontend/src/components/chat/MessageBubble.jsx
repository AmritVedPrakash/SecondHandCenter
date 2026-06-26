// ─────────────────────────────────────────────────────────────────────────────
//  MessageBubble  |  Single message in the chat window
//
//  message fields: _id, text, createdAt, isRead, sender: { _id, name, avatar }
//  isMine — bool (sender._id === currentUser._id)
//  showAvatar — bool (show sender avatar for grouped messages)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { motion } from 'framer-motion';
import UserAvatarDef from '../user/UserAvatar';

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function MessageBubble({ message, isMine, showAvatar = true }) {
  const [showTime, setShowTime] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-end gap-2 group ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar (only for "theirs", only when showAvatar=true) */}
      {!isMine && (
        <div className="w-7 flex-shrink-0 mb-0.5">
          {showAvatar ? (
            <UserAvatarDef user={message.sender} size="xs" showBadge={false} />
          ) : (
            <div className="w-7" /> // spacer to keep alignment
          )}
        </div>
      )}

      {/* Bubble + meta */}
      <div className={`flex flex-col gap-0.5 max-w-[72%] ${isMine ? 'items-end' : 'items-start'}`}>
        <motion.div
          onClick={() => setShowTime(v => !v)}
          whileTap={{ scale: 0.98 }}
          className={`
            px-4 py-2.5 cursor-pointer select-none
            text-sm leading-relaxed font-medium
            ${isMine
              ? 'bg-primary-gradient text-white rounded-2xl rounded-br-sm shadow-[0_2px_12px_rgba(224,140,42,0.35)]'
              : 'bg-white text-charcoal-800 rounded-2xl rounded-bl-sm shadow-card border border-cream-200'
            }
          `}
        >
          {/* Parse links in text */}
          {message.text.split(/(\s+)/).map((word, i) =>
            /^https?:\/\//.test(word) ? (
              <a key={i} href={word} target="_blank" rel="noopener noreferrer"
                className={`underline ${isMine ? 'text-white/80 hover:text-white' : 'text-primary-600 hover:text-primary-700'}`}
                onClick={e => e.stopPropagation()}>
                {word}
              </a>
            ) : word
          )}
        </motion.div>

        {/* Timestamp + read status */}
        <div className={`flex items-center gap-1 transition-all duration-200 ${showTime ? 'opacity-100 max-h-6' : 'opacity-0 max-h-0 overflow-hidden'}`}>
          <span className="text-[11px] text-cream-400 font-medium">
            {formatTime(message.createdAt)}
          </span>
          {isMine && (
            <span className={`text-[11px] ${message.isRead ? 'text-forest-500' : 'text-cream-400'}`}>
              {message.isRead ? '✓✓' : '✓'}
            </span>
          )}
        </div>

        {/* Always-visible tiny time on hover */}
        <span className={`text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isMine ? 'text-cream-400' : 'text-cream-400'}`}>
          {formatTime(message.createdAt)}
          {isMine && <span className={`ml-1 ${message.isRead ? 'text-forest-500' : ''}`}>{message.isRead ? '✓✓' : '✓'}</span>}
        </span>
      </div>

      {/* Spacer on mine side */}
      {isMine && <div className="w-7 flex-shrink-0" />}
    </motion.div>
  );
}
