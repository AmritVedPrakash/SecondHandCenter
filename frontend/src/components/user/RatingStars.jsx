// ─────────────────────────────────────────────────────────────────────────────
//  RatingStars  |  Read-only display OR interactive picker
//  Props:
//    value    — number 0-5 (supports decimals for display)
//    max      — default 5
//    interactive — if true, shows clickable + hover states
//    onChange — called with new value (1-5)
//    size     — xs | sm | md | lg | xl
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';

const SIZES = { xs:'text-sm', sm:'text-base', md:'text-xl', lg:'text-2xl', xl:'text-3xl' };

export default function RatingStars({
  value      = 0,
  max        = 5,
  interactive = false,
  onChange,
  size       = 'sm',
  showValue  = false,
  className  = '',
}) {
  const [hovered, setHovered] = useState(0);

  const display = interactive ? (hovered || value) : value;

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i + 1 <= display;
        const half   = !filled && i + 0.5 <= display;

        return (
          <span
            key={i}
            className={`
              ${SIZES[size]}
              transition-all duration-100
              ${interactive
                ? 'cursor-pointer hover:scale-125 active:scale-110 select-none'
                : 'cursor-default select-none'}
              ${filled ? 'text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]'
                : half  ? 'text-amber-300'
                : interactive && hovered >= i + 1 ? 'text-amber-300'
                : 'text-cream-300'}
            `}
            onMouseEnter={() => interactive && setHovered(i + 1)}
            onMouseLeave={() => interactive && setHovered(0)}
            onClick={() => interactive && onChange?.(i + 1)}
            role={interactive ? 'button' : undefined}
            aria-label={interactive ? `Rate ${i + 1} star${i + 1 !== 1 ? 's' : ''}` : undefined}
          >
            {half ? '½' : '★'}
          </span>
        );
      })}
      {showValue && value > 0 && (
        <span className="ml-1 text-xs font-semibold text-charcoal-800/70">{value.toFixed(1)}</span>
      )}
    </span>
  );
}

// ── Compact display (number + star) ──────────────────────────────────────────
export function StarBadge({ average = 0, count = 0, size = 'sm' }) {
  if (average === 0) return null;
  const sz = { xs:'text-xs', sm:'text-xs', md:'text-sm', lg:'text-sm' }[size] ?? 'text-xs';
  return (
    <span className={`inline-flex items-center gap-1 ${sz} font-semibold text-charcoal-800/80`}>
      <span className="text-amber-400">★</span>
      <span>{average.toFixed(1)}</span>
      {count > 0 && <span className="text-cream-500 font-normal">({count})</span>}
    </span>
  );
}
