// ─────────────────────────────────────────────────────────────────────────────
//  TypingIndicator  |  Animated "..." dots when other user is typing
// ─────────────────────────────────────────────────────────────────────────────

import { motion, AnimatePresence } from 'framer-motion';

export default function TypingIndicator({ isVisible = false, userName = '' }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="flex items-end gap-2 px-4"
        >
          {/* Spacer for avatar alignment */}
          <div className="w-7 flex-shrink-0" />

          <div className="flex flex-col gap-0.5 items-start">
            <div className="bg-white border border-cream-200 shadow-card rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  className="w-2 h-2 rounded-full bg-cream-400 block"
                  animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.18,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
            {userName && (
              <span className="text-[10px] text-cream-400 font-medium ml-1">
                {userName} is typing…
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
