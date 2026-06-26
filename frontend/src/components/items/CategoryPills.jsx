// ─────────────────────────────────────────────────────────────────────────────
//  CategoryPills  |  Horizontal scroll pills — All, Electronics, Books, etc.
// ─────────────────────────────────────────────────────────────────────────────

import { motion } from 'framer-motion';
import { ALL_CATEGORIES, CAT_ICONS } from './helpers';

export default function CategoryPills({ selected = 'All', onSelect }) {
  return (
    <div className="scroll-row gap-2 py-0.5">
      {ALL_CATEGORIES.map((cat) => {
        const active = selected === cat;
        return (
          <motion.button
            key={cat}
            onClick={() => onSelect(cat)}
            whileTap={{ scale: 0.94 }}
            className={`
              flex-shrink-0 flex items-center gap-1.5
              text-sm font-semibold px-4 py-2 rounded-full border
              transition-all duration-200 whitespace-nowrap
              ${active
                ? 'bg-primary-gradient text-white border-transparent shadow-[0_2px_12px_rgba(224,140,42,0.4)]'
                : 'bg-white text-charcoal-800/70 border-cream-300 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50'
              }
            `}
          >
            {cat !== 'All' && <span>{CAT_ICONS[cat]}</span>}
            {cat}
            {active && cat !== 'All' && (
              <motion.span
                layoutId="cat-active-dot"
                className="w-1.5 h-1.5 rounded-full bg-white/80"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
