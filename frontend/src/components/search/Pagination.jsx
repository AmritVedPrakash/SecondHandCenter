// ─────────────────────────────────────────────────────────────────────────────
//  Pagination  |  Page controls for search results
//  Props: page, pages, total, limit, onChange
// ─────────────────────────────────────────────────────────────────────────────

import { motion } from 'framer-motion';

export default function Pagination({ page = 1, pages = 1, total = 0, limit = 20, onChange }) {
  if (pages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end   = Math.min(page * limit, total);

  // Build page number array with ellipsis
  const getPageNums = () => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const arr = new Set([1, 2, page - 1, page, page + 1, pages - 1, pages].filter(n => n >= 1 && n <= pages));
    const sorted = [...arr].sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…');
      result.push(sorted[i]);
    }
    return result;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-3 py-4"
    >
      {/* Count label */}
      <p className="text-xs text-cream-400 font-medium">
        Showing <span className="text-charcoal-800 font-bold">{start}–{end}</span> of{' '}
        <span className="text-charcoal-800 font-bold">{total}</span> items
      </p>

      {/* Buttons */}
      <div className="flex items-center gap-1.5">
        {/* Prev */}
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-cream-200 bg-white text-cream-500 hover:text-charcoal-800 hover:border-cream-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          aria-label="Previous page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page numbers */}
        {getPageNums().map((n, i) =>
          n === '…' ? (
            <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-cream-400 text-sm font-bold">
              …
            </span>
          ) : (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-150 ${
                n === page
                  ? 'bg-primary-gradient text-white shadow-[0_2px_8px_rgba(224,140,42,0.4)]'
                  : 'bg-white border border-cream-200 text-charcoal-800/70 hover:border-cream-400 hover:text-charcoal-800'
              }`}
            >
              {n}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-cream-200 bg-white text-cream-500 hover:text-charcoal-800 hover:border-cream-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          aria-label="Next page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}
