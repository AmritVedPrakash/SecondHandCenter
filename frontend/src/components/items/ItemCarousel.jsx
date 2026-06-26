// ─────────────────────────────────────────────────────────────────────────────
//  ItemCarousel  |  Photo gallery for ItemDetailPage
//  photos[] — array of Cloudinary URL strings (max 4)
//  Features: arrows, dot indicators, thumbnail strip, swipe (touch)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CAT_ICONS } from './helpers';

export default function ItemCarousel({ photos = [], category = 'Other', title = '' }) {
  const [idx, setIdx]     = useState(0);
  const [dir, setDir]     = useState(1);
  const touchStartX = useRef(null);

  const go = (newIdx) => {
    setDir(newIdx > idx ? 1 : -1);
    setIdx(newIdx);
  };
  const prev = () => go(idx === 0 ? photos.length - 1 : idx - 1);
  const next = () => go(idx === photos.length - 1 ? 0 : idx + 1);

  // Touch swipe
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  const variants = {
    enter: (d) => ({ opacity: 0, x: d > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit:  (d) => ({ opacity: 0, x: d > 0 ? -60 : 60 }),
  };

  return (
    <div className="space-y-3">
      {/* ── Main photo ── */}
      <div
        className="relative aspect-[4/3] bg-cream-100 rounded-3xl overflow-hidden select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {photos.length > 0 ? (
          <AnimatePresence custom={dir} mode="popLayout">
            <motion.img
              key={idx}
              src={photos[idx]}
              alt={`${title} — photo ${idx + 1}`}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.16,1,0.3,1] }}
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
          </AnimatePresence>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl">
            {CAT_ICONS[category] || '📦'}
          </div>
        )}

        {/* Prev / Next arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-white/80 backdrop-blur-sm shadow-card flex items-center justify-center text-charcoal-800 hover:bg-white hover:shadow-card-md transition-all active:scale-95 z-10"
              aria-label="Previous photo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-white/80 backdrop-blur-sm shadow-card flex items-center justify-center text-charcoal-800 hover:bg-white hover:shadow-card-md transition-all active:scale-95 z-10"
              aria-label="Next photo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Photo count */}
        {photos.length > 1 && (
          <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
            {idx + 1}/{photos.length}
          </span>
        )}

        {/* Dot indicators */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                className={`rounded-full transition-all duration-200 ${i === idx ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Thumbnails ── */}
      {photos.length > 1 && (
        <div className="flex gap-2">
          {photos.map((src, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${
                i === idx
                  ? 'border-primary-500 shadow-[0_0_0_3px_rgba(224,140,42,0.2)] scale-105'
                  : 'border-cream-200 opacity-60 hover:opacity-90 hover:border-cream-400'
              }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
