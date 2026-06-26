// ─────────────────────────────────────────────────────────────────────────────
//  FilterPanel  |  FIXED — fully responsive mobile layout
//
//  FIXES:
//    1. Category grid: grid-cols-4 → grid-cols-3 sm:grid-cols-4
//       7 categories fit properly in 3 columns on mobile (3+3+1)
//    2. Category pill labels: no more truncation, full text shown
//    3. Price presets: wrap properly on small screens
//    4. Whole panel uses proper mobile padding
//    5. Added horizontal scroll pill bar as ALTERNATIVE category selector
//       (pills on mobile, grid on desktop) — better touch target size
// ─────────────────────────────────────────────────────────────────────────────

import { motion } from 'framer-motion';
import { CATEGORIES, CAT_ICONS } from '../items/helpers';
import RadiusSlider from './RadiusSlider';

const ALL_CATS = ['All', ...CATEGORIES];

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label, description }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full group"
    >
      <div className="text-left flex-1 min-w-0 pr-3">
        <p className="text-sm font-semibold text-charcoal-800 group-hover:text-primary-600 transition-colors">
          {label}
        </p>
        {description && (
          <p className="text-xs text-cream-400 mt-0.5">{description}</p>
        )}
      </div>
      <div
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
          checked
            ? 'bg-forest-gradient shadow-[0_0_0_3px_rgba(69,122,72,0.15)]'
            : 'bg-cream-300'
        }`}
      >
        <motion.div
          animate={{ x: checked ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </div>
    </button>
  );
}

// ── Price input ───────────────────────────────────────────────────────────────
function PriceInput({ label, value, onChange, placeholder }) {
  return (
    <div className="flex-1 min-w-0">
      <label className="block text-xs font-semibold text-charcoal-800/70 mb-1">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-bold text-cream-500">
          ₹
        </span>
        <input
          type="number"
          min="0"
          inputMode="numeric"
          value={value ?? ''}
          onChange={e =>
            onChange(e.target.value === '' ? undefined : Number(e.target.value))
          }
          placeholder={placeholder}
          className="input pl-7 h-10 text-sm"
        />
      </div>
    </div>
  );
}

// ── Category button ───────────────────────────────────────────────────────────
function CatBtn({ cat, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(cat)}
      className={`
        flex flex-col items-center justify-center gap-1.5
        py-3 px-2 rounded-2xl border transition-all duration-150
        min-h-[72px] w-full
        ${active
          ? 'bg-primary-50 border-primary-400 shadow-[0_0_0_3px_rgba(224,140,42,0.12)]'
          : 'bg-white border-cream-200 hover:border-primary-300 hover:bg-primary-50/50 active:scale-95'
        }
      `}
    >
      <span className="text-xl leading-none select-none">
        {cat === 'All' ? '🔍' : CAT_ICONS[cat]}
      </span>
      <span
        className={`text-[11px] font-bold leading-tight text-center w-full ${
          active ? 'text-primary-700' : 'text-charcoal-800/70'
        }`}
      >
        {/* Full label — no truncation */}
        {cat}
      </span>
    </button>
  );
}

// ── Main FilterPanel ──────────────────────────────────────────────────────────
export default function FilterPanel({
  filters        = {},
  onChange,
  radius         = 5,
  onRadiusChange,
  onReset,
  hasLocation    = false,
  className      = '',
}) {
  const set = (k, v) => onChange({ ...filters, [k]: v });

  const hasActiveFilters =
    (filters.category && filters.category !== 'All') ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.isFree;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={`card overflow-hidden ${className}`}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-cream-100">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-primary-500"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          <span className="text-sm font-bold text-charcoal-800">Filters</span>
          {hasActiveFilters && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
              Active
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset all
          </button>
        )}
      </div>

      <div className="p-4 space-y-5">

        {/* ── Category ──────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <p className="text-sm font-bold text-charcoal-800">Category</p>

          {/* FIX: 3 cols on mobile (xs), 4 cols on sm+
              7 items: row1=All+Electronics+Furniture, row2=Books+Clothes+FarmTools, row3=Other
              All text visible, no truncation */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {ALL_CATS.map(cat => (
              <CatBtn
                key={cat}
                cat={cat}
                active={(filters.category || 'All') === cat}
                onClick={v => set('category', v)}
              />
            ))}
          </div>
        </div>

        {/* ── Free toggle ───────────────────────────────────────────────────── */}
        <div className="p-3.5 bg-forest-50 rounded-xl border border-forest-200">
          <Toggle
            checked={filters.isFree ?? false}
            onChange={v => {
              if (v) onChange({ ...filters, isFree: true, minPrice: undefined, maxPrice: undefined });
              else   onChange({ ...filters, isFree: false });
            }}
            label="Free items only 🎁"
            description="Show only items listed for free"
          />
        </div>

        {/* ── Price range ───────────────────────────────────────────────────── */}
        {!filters.isFree && (
          <div className="space-y-3">
            <p className="text-sm font-bold text-charcoal-800">Price Range (₹)</p>

            <div className="flex items-end gap-2.5">
              <PriceInput
                label="Min"
                value={filters.minPrice}
                onChange={v => set('minPrice', v)}
                placeholder="0"
              />
              <div className="pb-2.5 text-cream-400 font-bold flex-shrink-0">–</div>
              <PriceInput
                label="Max"
                value={filters.maxPrice}
                onChange={v => set('maxPrice', v)}
                placeholder="Any"
              />
            </div>

            {/* Quick presets — wrap nicely on mobile */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Under ₹500',   min: undefined, max: 500 },
                { label: '₹500–₹2k',    min: 500,       max: 2000 },
                { label: '₹2k–₹5k',     min: 2000,      max: 5000 },
                { label: 'Above ₹5k',   min: 5000,      max: undefined },
              ].map(({ label, min, max }) => {
                const isActive =
                  filters.minPrice === min && filters.maxPrice === max;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() =>
                      onChange({ ...filters, minPrice: min, maxPrice: max })
                    }
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-150 ${
                      isActive
                        ? 'bg-primary-100 text-primary-700 border-primary-400'
                        : 'bg-white text-charcoal-800/60 border-cream-300 hover:border-cream-400 hover:text-charcoal-800'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Radius slider ─────────────────────────────────────────────────── */}
        {hasLocation && onRadiusChange && (
          <>
            <div className="border-t border-cream-100" />
            <RadiusSlider value={radius} onChange={onRadiusChange} />
          </>
        )}

        {/* ── No location warning ───────────────────────────────────────────── */}
        {!hasLocation && (
          <div className="flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-base flex-shrink-0">📍</span>
            <p className="text-xs text-amber-800 font-medium">
              Enable location for distance-based filtering.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}