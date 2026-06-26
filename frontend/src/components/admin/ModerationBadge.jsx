// ModerationBadge.jsx
// Small pill badge showing item's moderationStatus.
// Used in ItemRow and AdminItemDetailPage.
//
// Props:
//   status — 'clean' | 'flagged' | 'under_review' | 'removed'
//   size   — 'sm' (default) | 'md'

const CONFIG = {
  clean: {
    label:  'Clean',
    icon:   '✓',
    bg:     'bg-green-500/10',
    text:   'text-green-400',
    border: 'border-green-500/20',
  },
  flagged: {
    label:  'Flagged',
    icon:   '🚩',
    bg:     'bg-red-500/10',
    text:   'text-red-400',
    border: 'border-red-500/20',
  },
  under_review: {
    label:  'In Review',
    icon:   '⏳',
    bg:     'bg-yellow-500/10',
    text:   'text-yellow-400',
    border: 'border-yellow-500/20',
  },
  removed: {
    label:  'Removed',
    icon:   '🗑️',
    bg:     'bg-[#1c1c2a]',
    text:   'text-[#5a5a78]',
    border: 'border-[#2a2a38]',
  },
};

export default function ModerationBadge({ status, size = 'sm' }) {
  const c = CONFIG[status] || CONFIG.clean;

  const sizeClass = size === 'md'
    ? 'text-xs px-2.5 py-1 gap-1.5'
    : 'text-[10px] px-2 py-0.5 gap-1';

  return (
    <span className={`inline-flex items-center rounded-full border font-semibold
                      ${sizeClass} ${c.bg} ${c.text} ${c.border}`}>
      <span className="leading-none">{c.icon}</span>
      {c.label}
    </span>
  );
}