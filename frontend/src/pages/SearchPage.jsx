// ─────────────────────────────────────────────────────────────────────────────
//  SearchPage  |  FIXED — mobile layout overlap resolved
//
//  ROOT CAUSE:
//    Both mobile FilterPanel and desktop sidebar were inside the same
//    <div className="flex gap-6"> — on mobile, flex row caused the filter
//    to sit beside the results instead of above them, causing overlap.
//
//  FIX:
//    Mobile: FilterPanel renders ABOVE the results (block layout, full width)
//            in its own column — completely outside the flex row
//    Desktop (md+): FilterPanel is a left sidebar inside flex row
//    The two layouts are mutually exclusive via CSS (block on mobile, flex on md+)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearch }   from '../hooks/useSearch';
import { useLocation } from '../hooks/useLocation';
import SearchBar       from '../components/search/SearchBar';
import FilterPanel     from '../components/search/FilterPanel';
import Pagination      from '../components/search/Pagination';
import ItemGrid        from '../components/items/ItemGrid';
import Spinner         from '../components/ui/Spinner';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasLocation, radius, setRadius } = useLocation();

  const [query,      setQuery]      = useState(searchParams.get('q') || '');
  const [showFilter, setShowFilter] = useState(false);
  const [filters,    setFilters]    = useState({
    category: searchParams.get('category') || 'All',
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    isFree:   searchParams.get('isFree') === 'true',
    page:     Number(searchParams.get('page')) || 1,
  });

  const { items, total, pages, page, isLoading, isFetching } = useSearch({
    q: query,
    ...filters,
  });

  const syncUrl = useCallback((q, f) => {
    const p = {};
    if (q) p.q = q;
    if (f.category && f.category !== 'All') p.category = f.category;
    if (f.minPrice)  p.minPrice = String(f.minPrice);
    if (f.maxPrice)  p.maxPrice = String(f.maxPrice);
    if (f.isFree)    p.isFree   = 'true';
    if (f.page > 1)  p.page     = String(f.page);
    setSearchParams(p, { replace: true });
  }, [setSearchParams]);

  useEffect(() => syncUrl(query, filters), [query, filters]);

  const handleSearch  = (q) => { setQuery(q); setFilters(f => ({ ...f, page: 1 })); };
  const handleFilters = (f) => { setFilters({ ...f, page: 1 }); };
  const handlePage    = (p) => { setFilters(f => ({ ...f, page: p })); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleReset   = () => { setFilters({ category: 'All', page: 1 }); setQuery(''); };

  const activeFilterCount = [
    filters.category && filters.category !== 'All',
    filters.isFree,
    filters.minPrice !== undefined,
    filters.maxPrice !== undefined,
  ].filter(Boolean).length;

  // Shared FilterPanel props
  const filterPanelProps = {
    filters,
    onChange:       handleFilters,
    radius,
    onRadiusChange: setRadius,
    hasLocation,
    onReset:        handleReset,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">

      {/* ── Search bar ── */}
      <SearchBar
        value={query}
        onChange={setQuery}
        onSearch={handleSearch}
        autoFocus={!query}
        placeholder="Search items by name or description…"
      />

      {/* ── Toolbar: count + filter button ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm font-bold text-charcoal-800 truncate">
            {isLoading ? (
              <span className="text-cream-400">Searching…</span>
            ) : query ? (
              <>
                {total} result{total !== 1 ? 's' : ''} for{' '}
                <span className="text-primary-600">"{query}"</span>
              </>
            ) : (
              <>
                {total} item{total !== 1 ? 's' : ''}{' '}
                {hasLocation ? `within ${radius} km` : 'found'}
              </>
            )}
          </p>
          {isFetching && !isLoading && <Spinner size="sm" />}
        </div>

        <button
          onClick={() => setShowFilter(v => !v)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-semibold flex-shrink-0 transition-all ${
            showFilter || activeFilterCount > 0
              ? 'bg-primary-500 text-white border-primary-500 shadow-[0_2px_12px_rgba(224,140,42,0.3)]'
              : 'bg-white border-cream-300 hover:border-cream-400 text-charcoal-800'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-white text-primary-600 text-xs font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          MOBILE LAYOUT  (below md)
          FilterPanel stacks ABOVE results — full width, no side-by-side
      ──────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFilter && (
          <motion.div
            key="mobile-filter"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden"
          >
            {/* Extra wrapper so height animation doesn't cut content */}
            <div className="pb-1">
              <FilterPanel {...filterPanelProps} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ────────────────────────────────────────────────────────────────────────
          DESKTOP LAYOUT  (md+)
          FilterPanel is a left sidebar beside results
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="flex gap-6 items-start">

        {/* Desktop sidebar — hidden on mobile */}
        <AnimatePresence>
          {showFilter && (
            <motion.aside
              key="desktop-filter"
              initial={{ opacity: 0, width: 0, x: -16 }}
              animate={{ opacity: 1, width: 280, x: 0 }}
              exit={{ opacity: 0, width: 0, x: -16 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="hidden md:block flex-shrink-0 overflow-hidden"
            >
              <FilterPanel {...filterPanelProps} />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Results — always full width on mobile, flex-1 on desktop */}
        <div className="w-full min-w-0 space-y-5">
          <ItemGrid
            items={items}
            loading={isLoading}
            emptyTitle={query ? `No results for "${query}"` : 'No items found'}
            emptyDescription={
              activeFilterCount > 0
                ? 'Try clearing some filters or expanding the radius.'
                : 'Try a different search term.'
            }
            showPostCta={false}
          />
          <Pagination
            page={page}
            pages={pages}
            total={total}
            limit={20}
            onChange={handlePage}
          />
        </div>
      </div>
    </div>
  );
}