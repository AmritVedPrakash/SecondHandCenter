// ─────────────────────────────────────────────────────────────────────────────
//  Modal  |  Animated backdrop + card, closes on ESC or backdrop click
//  Uses Framer Motion for enter/exit animations
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth   = 'max-w-lg',
  closeOnBackdrop = true,
  showCloseBtn    = true,
}) {
  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handler);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-charcoal-900/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeOnBackdrop ? onClose : undefined}
          />

          {/* Panel */}
          <motion.div
            className={`
              relative bg-cream-50 rounded-3xl w-full ${maxWidth}
              shadow-[0_24px_60px_-8px_rgba(0,0,0,0.3)]
              border border-cream-200
              max-h-[90vh] overflow-y-auto
              flex flex-col
            `}
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0,  y: 24, scale: 0.97 }}
            transition={{ type: 'spring', duration: 0.45, bounce: 0.2 }}
          >
            {/* Header */}
            {(title || showCloseBtn) && (
              <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-0 flex-shrink-0">
                <div>
                  {title && (
                    <h2 className="text-lg font-bold text-charcoal-800 leading-tight">{title}</h2>
                  )}
                  {subtitle && (
                    <p className="text-sm text-cream-500 mt-0.5">{subtitle}</p>
                  )}
                </div>
                {showCloseBtn && (
                  <button
                    onClick={onClose}
                    className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-cream-500 hover:text-charcoal-800 hover:bg-cream-200 transition-all duration-150"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="px-6 pb-6 pt-5 flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
