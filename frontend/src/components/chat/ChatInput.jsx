// ─────────────────────────────────────────────────────────────────────────────
//  ChatInput  |  Auto-growing textarea + send button
//  - Send on Enter (not Shift+Enter)
//  - Emits typing / stop_typing events
//  - Disabled when sending
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import Spinner from '../ui/Spinner';

export default function ChatInput({
  onSend,
  onTyping,
  onStopTyping,
  sending   = false,
  disabled  = false,
  placeholder = 'Type a message…',
}) {
  const [text,  setText]  = useState('');
  const textareaRef       = useRef(null);
  const stopTypingTimer   = useRef(null);
  const isTypingRef       = useRef(false);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`; // max ~4 lines
  }, [text]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || sending || disabled) return;
    onSend(trimmed);
    setText('');
    isTypingRef.current = false;
    clearTimeout(stopTypingTimer.current);
    onStopTyping?.();
    // Reset height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [text, sending, disabled, onSend, onStopTyping]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);

    // Typing indicator
    if (e.target.value.trim()) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTyping?.();
      }
      clearTimeout(stopTypingTimer.current);
      stopTypingTimer.current = setTimeout(() => {
        isTypingRef.current = false;
        onStopTyping?.();
      }, 2000);
    } else {
      isTypingRef.current = false;
      clearTimeout(stopTypingTimer.current);
      onStopTyping?.();
    }
  };

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(stopTypingTimer.current), []);

  const canSend = text.trim().length > 0 && !sending && !disabled;

  return (
    <div className="flex items-end gap-2 p-3 bg-white border-t border-cream-200">
      <div className={`flex-1 flex items-end bg-cream-100 rounded-2xl border transition-all duration-200 ${disabled ? 'opacity-50' : 'border-cream-300 focus-within:border-primary-400 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(224,140,42,0.12)]'}`}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          maxLength={1000}
          className="flex-1 bg-transparent text-sm text-charcoal-800 placeholder-cream-400 px-4 py-2.5 resize-none focus:outline-none leading-relaxed font-medium"
          style={{ minHeight: '42px' }}
        />
        {text.length > 800 && (
          <span className={`text-[10px] px-2 pb-2 self-end font-medium flex-shrink-0 ${text.length >= 1000 ? 'text-red-400' : 'text-cream-400'}`}>
            {text.length}/1000
          </span>
        )}
      </div>

      {/* Send button */}
      <motion.button
        type="button"
        onClick={handleSend}
        disabled={!canSend}
        whileTap={canSend ? { scale: 0.9 } : {}}
        className={`
          w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center transition-all duration-200
          ${canSend
            ? 'bg-primary-gradient text-white shadow-[0_2px_12px_rgba(224,140,42,0.45)] hover:shadow-[0_4px_16px_rgba(224,140,42,0.55)]'
            : 'bg-cream-200 text-cream-400 cursor-not-allowed'
          }
        `}
        aria-label="Send message"
      >
        {sending ? (
          <Spinner size="sm" color="white" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        )}
      </motion.button>
    </div>
  );
}
