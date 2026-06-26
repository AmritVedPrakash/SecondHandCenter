// ─────────────────────────────────────────────────────────────────────────────
//  Spinner  |  sizes: sm · md · lg · xl
//  PageSpinner — full-page centered loader with animated logo mark
// ─────────────────────────────────────────────────────────────────────────────

export default function Spinner({ size = 'md', className = '', color = 'primary' }) {
  const sizes = {
    sm: 'w-4 h-4 border-[2px]',
    md: 'w-6 h-6 border-[2.5px]',
    lg: 'w-9 h-9 border-[3px]',
    xl: 'w-14 h-14 border-[3px]',
  };
  const colors = {
    primary: 'border-primary-500 border-t-transparent',
    forest:  'border-forest-500  border-t-transparent',
    white:   'border-white/80    border-t-transparent',
    cream:   'border-cream-400   border-t-transparent',
  };
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block rounded-full animate-spin flex-shrink-0 ${sizes[size]} ${colors[color]} ${className}`}
    />
  );
}

export function PageSpinner({ label = 'Loading…' }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-primary-gradient opacity-30 blur-xl scale-125" />
        <div className="relative w-14 h-14 rounded-2xl bg-primary-gradient flex items-center justify-center shadow-[0_6px_24px_rgba(224,140,42,0.45)]">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div className="absolute inset-0 rounded-2xl border-2 border-primary-400 animate-ping opacity-20" />
      </div>
      <p className="text-sm text-cream-500 font-medium tracking-wide animate-pulse">{label}</p>
    </div>
  );
}
