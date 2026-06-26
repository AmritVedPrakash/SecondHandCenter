// StatsCard.jsx
// Reusable stat tile used in DashboardPage.
//
// Props:
//   label   — string  — "Total Users"
//   value   — number  — 1420
//   icon    — string  — emoji "👥"
//   color   — string  — "orange" | "purple" | "green" | "red" | "cyan" | "yellow"
//   sub     — string  — small badge text e.g. "today" or "7 days"  (optional)
//   trend   — number  — positive = up arrow, negative = down arrow  (optional)
//   loading — bool    — shows shimmer skeleton while true

const PALETTE = {
  orange: {
    border: 'border-[#ff6b35]/20',
    bg:     'bg-[#ff6b35]/5',
    value:  'text-[#ff6b35]',
    glow:   'shadow-[0_0_24px_rgba(255,107,53,0.07)]',
  },
  purple: {
    border: 'border-purple-500/20',
    bg:     'bg-purple-500/5',
    value:  'text-purple-400',
    glow:   'shadow-[0_0_24px_rgba(168,85,247,0.07)]',
  },
  green: {
    border: 'border-green-500/20',
    bg:     'bg-green-500/5',
    value:  'text-green-400',
    glow:   'shadow-[0_0_24px_rgba(34,197,94,0.07)]',
  },
  red: {
    border: 'border-red-500/20',
    bg:     'bg-red-500/5',
    value:  'text-red-400',
    glow:   'shadow-[0_0_24px_rgba(239,68,68,0.07)]',
  },
  cyan: {
    border: 'border-cyan-500/20',
    bg:     'bg-cyan-500/5',
    value:  'text-cyan-400',
    glow:   'shadow-[0_0_24px_rgba(6,182,212,0.07)]',
  },
  yellow: {
    border: 'border-yellow-500/20',
    bg:     'bg-yellow-500/5',
    value:  'text-yellow-400',
    glow:   'shadow-[0_0_24px_rgba(251,191,36,0.07)]',
  },
};

export default function StatsCard({
  label,
  value,
  icon,
  color   = 'orange',
  sub,
  trend,
  loading = false,
}) {
  const p = PALETTE[color] || PALETTE.orange;

  return (
    <div className={`rounded-xl border p-5 transition-all duration-200
                     hover:-translate-y-0.5 hover:${p.glow}
                     ${p.border} ${p.bg}`}>

      {/* Top row — icon + sub badge */}
      <div className="flex items-start justify-between mb-4">
        <span className="text-2xl leading-none">{icon}</span>

        <div className="flex items-center gap-1.5">
          {sub && (
            <span className="text-[10px] font-mono text-[#5a5a78] bg-[#1c1c2a]
                             px-2 py-0.5 rounded-full border border-[#2a2a38]">
              {sub}
            </span>
          )}
          {trend !== undefined && trend !== null && (
            <span className={`text-[10px] font-mono font-bold
                              ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>

      {/* Value */}
      {loading ? (
        <div className="h-9 w-24 rounded-lg bg-[#2a2a38] animate-pulse mb-2" />
      ) : (
        <p className={`text-3xl font-black tracking-tight leading-none mb-1 ${p.value}`}>
          {value ?? '—'}
        </p>
      )}

      {/* Label */}
      <p className="text-xs text-[#5a5a78] font-medium mt-1.5">{label}</p>
    </div>
  );
}
