// ─────────────────────────────────────────────────────────────────────────────
//  SearchResultsMeta  |  "X results for 'query'" + sort selector + filter button
//  Used at the top of SearchPage results
// ─────────────────────────────────────────────────────────────────────────────

import { motion, AnimatePresence } from 'framer-motion';

export default function SearchResultsMeta({
  total       = 0,
  query       = '',
  isFetching  = false,
  filterCount = 0,
  onToggleFilters,
}) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      {/* Result count */}
      <div className="flex items-center gap-2">
        <AnimatePresence mode="wait">
          {isFetching ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary-400"
                    animate={{ y: [0,-4,0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i*0.15 }}
                  />
                ))}
              </div>
              <span className="text-sm text-cream-400 font-medium">Searching…</span>
            </motion.div>
          ) : (
            <motion.p
              key="count"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-charcoal-800/70 font-medium"
            >
              <span className="font-bold text-charcoal-800">{total.toLocaleString()}</span>
              {' '}item{total !== 1 ? 's' : ''}
              {query && (
                <> for <span className="text-primary-600 font-semibold">"{query}"</span></>
              )}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Filter toggle button */}
      <button
        type="button"
        onClick={onToggleFilters}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
          border transition-all duration-200 relative
          ${filterCount > 0
            ? 'bg-primary-50 border-primary-300 text-primary-700 hover:bg-primary-100'
            : 'bg-white border-cream-300 text-charcoal-800/70 hover:border-cream-400 hover:text-charcoal-800'
          }
        `}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filters
        {filterCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white"
          >
            {filterCount}
          </motion.span>
        )}
      </button>
    </div>
  );
}
