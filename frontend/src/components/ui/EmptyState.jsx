// ─────────────────────────────────────────────────────────────────────────────
//  EmptyState  |  Centered illustration + message + optional CTA
// ─────────────────────────────────────────────────────────────────────────────

import { motion } from 'framer-motion';

export default function EmptyState({
  icon        = '🔍',
  title       = 'Nothing here yet',
  description = '',
  action      = null,
  compact     = false,
}) {
  return (
    <motion.div
      className={`flex flex-col items-center justify-center text-center ${compact ? 'py-10 gap-3' : 'py-20 gap-4'}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Icon in a soft pill */}
      <div className={`${compact ? 'w-16 h-16 text-3xl' : 'w-20 h-20 text-4xl'} rounded-3xl bg-cream-100 border border-cream-200 flex items-center justify-center animate-float`}>
        {icon}
      </div>

      {/* Text */}
      <div className="space-y-1.5">
        <h3 className={`font-bold text-charcoal-800 ${compact ? 'text-base' : 'text-lg'}`}>{title}</h3>
        {description && (
          <p className={`text-cream-500 leading-relaxed max-w-xs mx-auto ${compact ? 'text-xs' : 'text-sm'}`}>
            {description}
          </p>
        )}
      </div>

      {/* CTA */}
      {action && <div className="mt-1">{action}</div>}
    </motion.div>
  );
}
