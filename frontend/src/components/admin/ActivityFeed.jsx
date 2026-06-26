// ActivityFeed.jsx
// Shows last N admin audit log entries from adminStore (prefetched by AdminLayout).
// Falls back to fresh API call if store is empty.

import { useEffect } from 'react';
import useAdminStore from '../../store/adminStore';
import { getAdminLogs } from '../../api/admin.api';

// ── Action metadata map ────────────────────────────────────────────────────────
const ACTION_META = {
  ban_user:             { label: 'User banned',          icon: '🔨', color: 'text-red-400'    },
  unban_user:           { label: 'User unbanned',        icon: '✅', color: 'text-green-400'  },
  delete_item:          { label: 'Item deleted',         icon: '🗑️', color: 'text-red-400'    },
  restore_item:         { label: 'Item restored',        icon: '♻️', color: 'text-green-400'  },
  confirm_content_flag: { label: 'Flag confirmed',       icon: '🚩', color: 'text-orange-400' },
  dismiss_content_flag: { label: 'Flag dismissed',       icon: '✓',  color: 'text-[#5a5a78]' },
  verify_student:       { label: 'Student badge granted',icon: '🎓', color: 'text-purple-400' },
  revoke_student:       { label: 'Student badge revoked',icon: '❌', color: 'text-red-400'    },
  make_admin:           { label: 'Admin access granted', icon: '👑', color: 'text-yellow-400' },
  revoke_admin:         { label: 'Admin access revoked', icon: '⛔', color: 'text-red-400'    },
  resolve_report:       { label: 'Report resolved',      icon: '📋', color: 'text-cyan-400'   },
  dismiss_report:       { label: 'Report dismissed',     icon: '📋', color: 'text-[#5a5a78]' },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m    = Math.floor(diff / 60_000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function ActivityFeed() {
  const logs        = useAdminStore((s) => s.recentLogs);
  const loading     = useAdminStore((s) => s.logsLoading);
  const setLogs     = useAdminStore((s) => s.setRecentLogs);
  const setLoading  = useAdminStore((s) => s.setLogsLoading);

  // Fetch only if AdminLayout hasn't already populated the store
  useEffect(() => {
    if (logs.length > 0 || loading) return;
    setLoading(true);
    getAdminLogs({ limit: 10 })
      .then((r) => setLogs(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#13131a] border border-[#2a2a38] rounded-xl p-5 h-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-[#e2e2ee] text-sm">Recent Activity</h3>
        <span className="text-[10px] font-mono text-[#5a5a78] bg-[#0f0f13]
                         px-2 py-0.5 rounded-full border border-[#2a2a38]">
          Audit Log
        </span>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-[#2a2a38] flex-shrink-0" />
              <div className="flex-1 space-y-1.5 pt-0.5">
                <div className="h-3 bg-[#2a2a38] rounded w-3/4" />
                <div className="h-2.5 bg-[#2a2a38] rounded w-1/2" />
              </div>
              <div className="h-2.5 w-10 bg-[#2a2a38] rounded flex-shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && logs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-sm text-[#5a5a78]">No admin activity yet.</p>
        </div>
      )}

      {/* Log entries */}
      {!loading && logs.length > 0 && (
        <div className="space-y-1">
          {logs.map((log, index) => {
            const meta = ACTION_META[log.action] || {
              label: log.action.replace(/_/g, ' '),
              icon:  '•',
              color: 'text-[#5a5a78]',
            };

            return (
              <div
                key={log._id}
                className={`flex items-start gap-3 py-2.5
                            ${index < logs.length - 1 ? 'border-b border-[#1c1c2a]' : ''}`}
              >
                {/* Icon circle */}
                <div className="w-7 h-7 rounded-full bg-[#0f0f13] border border-[#2a2a38]
                                flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                  {meta.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold leading-tight ${meta.color}`}>
                    {meta.label}
                  </p>
                  <p className="text-xs text-[#5a5a78] mt-0.5 truncate">
                    by{' '}
                    <span className="text-[#a0a0b8]">{log.admin?.name || 'Admin'}</span>
                    {log.note && (
                      <>
                        {' '}—{' '}
                        <span className="italic truncate">{log.note}</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Time */}
                <span className="text-[10px] font-mono text-[#5a5a78] flex-shrink-0 mt-0.5">
                  {timeAgo(log.createdAt)}
                </span>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
