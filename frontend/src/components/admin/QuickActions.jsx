// QuickActions.jsx
// 4 shortcut tiles — each navigates to a pre-filtered admin page.
// Badge counts are pulled from adminStore (already fetched by AdminLayout).

import { useNavigate } from 'react-router-dom';
import useAdminStore   from '../../store/adminStore';

export default function QuickActions() {
  const navigate = useNavigate();
  const stats    = useAdminStore((s) => s.stats);

  const ACTIONS = [
    {
      label:   'Review Flags',
      desc:    'Pending content violations',
      icon:    '🚩',
      to:      '/admin/flags?status=pending',
      count:   stats?.flags?.pending || 0,
      palette: {
        border: 'border-red-500/20',
        bg:     'hover:bg-red-500/5',
        badge:  'bg-red-500/15 text-red-400 border-red-500/25',
        arrow:  'text-red-400',
      },
    },
    {
      label:   'Open Reports',
      desc:    'User-submitted reports',
      icon:    '📋',
      to:      '/admin/reports?status=pending',
      count:   stats?.reports?.pending || 0,
      palette: {
        border: 'border-orange-500/20',
        bg:     'hover:bg-orange-500/5',
        badge:  'bg-orange-500/15 text-orange-400 border-orange-500/25',
        arrow:  'text-orange-400',
      },
    },
    {
      label:   'Banned Users',
      desc:    'Manage banned accounts',
      icon:    '🔨',
      to:      '/admin/users?banned=true',
      count:   stats?.users?.banned || 0,
      palette: {
        border: 'border-purple-500/20',
        bg:     'hover:bg-purple-500/5',
        badge:  'bg-purple-500/15 text-purple-400 border-purple-500/25',
        arrow:  'text-purple-400',
      },
    },
    {
      label:   'Hidden Items',
      desc:    'Removed from feed',
      icon:    '🫥',
      to:      '/admin/items?moderationStatus=removed',
      count:   stats?.items?.hidden || 0,
      palette: {
        border: 'border-cyan-500/20',
        bg:     'hover:bg-cyan-500/5',
        badge:  'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
        arrow:  'text-cyan-400',
      },
    },
  ];

  return (
    <div className="bg-[#13131a] border border-[#2a2a38] rounded-xl p-5">

      {/* Header */}
      <h3 className="font-bold text-[#e2e2ee] text-sm mb-4">Quick Actions</h3>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map((a) => (
          <button
            key={a.to}
            onClick={() => navigate(a.to)}
            className={`relative text-left p-4 rounded-xl border transition-all duration-150
                        hover:-translate-y-0.5 active:translate-y-0 cursor-pointer
                        bg-[#0f0f13] ${a.palette.border} ${a.palette.bg}`}
          >
            {/* Count badge — top right */}
            {a.count > 0 && (
              <span className={`absolute top-3 right-3 text-[10px] font-mono font-bold
                                px-1.5 py-0.5 rounded-full border ${a.palette.badge}`}>
                {a.count > 99 ? '99+' : a.count}
              </span>
            )}

            <span className="text-xl block mb-2 leading-none">{a.icon}</span>
            <p className="text-sm font-semibold text-[#e2e2ee] leading-tight mb-0.5">
              {a.label}
            </p>
            <p className="text-xs text-[#5a5a78] leading-tight">{a.desc}</p>

            {/* Arrow */}
            <span className={`text-xs mt-2 block font-mono ${a.palette.arrow}`}>→</span>
          </button>
        ))}
      </div>

    </div>
  );
}
