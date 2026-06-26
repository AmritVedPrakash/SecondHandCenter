// ─────────────────────────────────────────────────────────────────────────────
//  RadiusSlider  |  1–20 km range slider
//  Reads from / writes to locationStore directly
//  Props: value (km), onChange
// ─────────────────────────────────────────────────────────────────────────────

import { useRef } from 'react';
import { motion } from 'framer-motion';

const MARKS = [1, 2, 5, 10, 15, 20];

export default function RadiusSlider({ value = 5, onChange }) {
  const trackRef = useRef(null);
  const pct = ((value - 1) / (20 - 1)) * 100;

  return (
    <div className="space-y-3">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-charcoal-800">Search Radius</span>
        <motion.span
          key={value}
          initial={{ scale: 1.2, color: '#e08c2a' }}
          animate={{ scale: 1,   color: '#1c1917' }}
          transition={{ duration: 0.25 }}
          className="text-sm font-extrabold"
        >
          {value} km
        </motion.span>
      </div>

      {/* Slider track */}
      <div className="relative py-1" ref={trackRef}>
        {/* Track bg */}
        <div className="h-2 rounded-full bg-cream-200 relative overflow-hidden">
          {/* Filled portion */}
          <div
            className="absolute inset-y-0 left-0 bg-primary-gradient rounded-full transition-all duration-150"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* HTML range input (invisible, sits on top) */}
        <input
          type="range"
          min={1} max={20} step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
        />

        {/* Custom thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-[3px] border-primary-500 shadow-[0_2px_8px_rgba(224,140,42,0.45)] transition-all duration-150 pointer-events-none"
          style={{ left: `calc(${pct}% - 10px)` }}
        />
      </div>

      {/* Quick-pick marks */}
      <div className="flex items-center justify-between px-0.5">
        {MARKS.map(mark => (
          <button
            key={mark}
            type="button"
            onClick={() => onChange(mark)}
            className={`text-xs font-semibold transition-all duration-150 px-1.5 py-0.5 rounded-lg ${
              value === mark
                ? 'text-primary-600 bg-primary-100'
                : 'text-cream-400 hover:text-charcoal-800 hover:bg-cream-100'
            }`}
          >
            {mark}km
          </button>
        ))}
      </div>

      {/* Context text */}
      <p className="text-xs text-cream-400 font-medium text-center">
        Showing items within <span className="text-primary-600 font-bold">{value} km</span> of your location
      </p>
    </div>
  );
}
