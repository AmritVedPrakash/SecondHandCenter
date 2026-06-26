// ─────────────────────────────────────────────────────────────────────────────
//  Home  |  /
//  Shows: hero, location banner, category pills, filter panel, items grid
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNearbyItems }  from '../hooks/useNearbyItems';
import { useLocation }     from '../hooks/useLocation';
import { useAuthStore }    from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import ItemGrid            from '../components/items/ItemGrid';
import FallbackBanner      from '../components/items/FallbackBanner';
import CategoryPills       from '../components/items/CategoryPills';
import FilterPanel from '../components/search/FilterPanel';
import RadiusSlider        from '../components/search/RadiusSlider';
import Button              from '../components/ui/Button';
import Spinner             from '../components/ui/Spinner';

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest first' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
];

export default function Home() {
  const { user, isAuthenticated } = useAuthStore();
  const { hasLocation, lat, lng, radius, locationName, isLocating, requestLocation, setRadius } = useLocation();
  const locStore = useLocationStore();

  const [category,     setCategory]     = useState('All');
  const [showFilters,  setShowFilters]  = useState(false);
  const [filters,      setFilters]      = useState({ isFree: false });

  // Build extra params for useNearbyItems
  const extraParams = {
    ...(category !== 'All' && { category }),
    ...(filters.isFree    && { minPrice: 0, maxPrice: 0 }),
    ...(!filters.isFree && filters.minPrice !== undefined && { minPrice: filters.minPrice }),
    ...(!filters.isFree && filters.maxPrice !== undefined && { maxPrice: filters.maxPrice }),
  };

  const { items, total, isLoading, isFetching, refetch, meta } = useNearbyItems(extraParams);

  // Try to get location silently on first visit
  useEffect(() => {
    if (!hasLocation) requestLocation({ silent: true }).catch(() => {});
  }, []);

  const activeFilterCount = [
    category !== 'All',
    filters.isFree,
    filters.minPrice !== undefined,
    filters.maxPrice !== undefined,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-hero-gradient border-b border-cream-200">
        {/* Decorative dots */}
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-primary-100 border border-primary-200 rounded-full px-3 py-1 mb-4">
              <span className="text-xs font-bold text-primary-700">🌿 Village to City — One Platform</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-charcoal-800 leading-tight tracking-tight mb-3">
              Your local bazaar,{' '}
              <span className="text-gradient-primary">right here.</span>
            </h1>
            <p className="text-base md:text-lg text-charcoal-800/60 font-medium mb-7 leading-relaxed max-w-xl">
              Buy, sell or donate second-hand goods within your community.
              No delivery, no strangers — just neighbours.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {isAuthenticated ? (
                <Link to="/items/create">
                  <Button variant="primary" size="lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Post an Item
                  </Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button variant="primary" size="lg">Get Started — Free</Button>
                </Link>
              )}
              {!hasLocation && (
                <Button variant="secondary" size="lg" loading={isLocating} onClick={() => requestLocation()}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Enable Location
                </Button>
              )}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-6 mt-8">
              {[
                { icon: '📦', label: 'Items near you', value: hasLocation ? `${total}+` : '—' },
                { icon: '🤝', label: 'Zero commission', value: 'Always' },
                { icon: '📍', label: 'Hyperlocal',      value: `${radius} km` },
              ].map(({ icon, label, value }) => (
                <div key={label} className="text-center hidden sm:block">
                  <p className="text-lg">{icon}</p>
                  <p className="text-sm font-extrabold text-charcoal-800">{value}</p>
                  <p className="text-xs text-cream-400 font-medium">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Location banner ── */}
        <AnimatePresence>
          {!hasLocation && !isLocating && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start sm:items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-lg">📍</div>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-900">Enable location for nearby results</p>
                <p className="text-xs text-amber-700 mt-0.5">See items only from your locality — within {radius} km of you.</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => requestLocation()} className="flex-shrink-0">
                Enable →
              </Button>
            </motion.div>
          )}

          {isLocating && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-4 bg-primary-50 border border-primary-200 rounded-2xl">
              <Spinner size="sm" />
              <p className="text-sm font-semibold text-primary-700">Getting your location…</p>
            </motion.div>
          )}

          {hasLocation && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-3 px-4 py-2.5 bg-forest-50 border border-forest-200 rounded-xl"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-forest-500 animate-pulse" />
                <span className="text-xs font-semibold text-forest-700">
                  {locationName ? `📍 ${locationName}` : '📍 Location active'} — {radius} km radius
                </span>
              </div>
              <button onClick={() => requestLocation()} className="text-xs font-bold text-forest-600 hover:text-forest-800 underline underline-offset-2">
                Refresh
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Category pills ── */}
        <CategoryPills selected={category} onSelect={setCategory} />

        {/* ── Toolbar: count + filter + sort ── */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-charcoal-800">
              {isLoading ? (
                <span className="text-cream-400">Loading…</span>
              ) : (
                <>{total} item{total !== 1 ? 's' : ''} {hasLocation ? `within ${radius} km` : 'available'}</>
              )}
            </p>
            {isFetching && !isLoading && <Spinner size="sm" />}
          </div>

          <div className="flex items-center gap-2">
            {/* Radius quick badge */}
            {hasLocation && (
              <button
                onClick={() => setShowFilters(v => !v)}
                className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-cream-500 hover:text-charcoal-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3" strokeWidth={2} />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v3m0 14v3M2 12h3m14 0h3" />
                </svg>
                {radius} km
              </button>
            )}

            {/* Filter button */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all ${
                showFilters || activeFilterCount > 0
                  ? 'bg-primary-500 text-white border-primary-500 shadow-[0_2px_12px_rgba(224,140,42,0.35)]'
                  : 'bg-white text-charcoal-800 border-cream-300 hover:border-cream-400'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-primary-600 text-xs font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Filter panel ── */}
        <AnimatePresence>
          {showFilters && (
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              radius={radius}
              onRadiusChange={(km) => { setRadius(km); }}
              hasLocation={hasLocation}
              onReset={() => { setFilters({ isFree: false }); setCategory('All'); }}
            />
          )}
        </AnimatePresence>

        {/* ── Items grid ── */}
        <FallbackBanner meta={meta} />
        <ItemGrid
          items={items}
          loading={isLoading}
          emptyTitle={hasLocation ? 'No items found nearby' : 'No active listings right now'}
          emptyDescription={hasLocation
            ? 'Try expanding the radius or clearing filters.'
            : 'Showing all active listings by default when location is unavailable.'}
          showPostCta={isAuthenticated}
        />
      </div>
    </div>
  );
}
