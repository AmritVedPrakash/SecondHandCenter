// DashboardPage.jsx
// Route: /admin  (index)
//
// Data flow:
//   AdminLayout prefetches stats → adminStore.stats
//   DashboardPage reads from store — no duplicate API call.
//   If store is empty (e.g. hard refresh on /admin) it fetches itself.

import { useEffect }  from 'react';
import { Link }       from 'react-router-dom';
import useAdminStore  from '../../store/adminStore';
import { getAdminStats } from '../../api/admin.api';
import StatsCard    from '../../components/admin/StatsCard';
import ActivityFeed from '../../components/admin/ActivityFeed';
import QuickActions from '../../components/admin/QuickActions';

export default function DashboardPage() {
  const stats        = useAdminStore((s) => s.stats);
  const loading      = useAdminStore((s) => s.statsLoading);
  const error        = useAdminStore((s) => s.statsError);
  const setStats     = useAdminStore((s) => s.setStats);
  const setLoading   = useAdminStore((s) => s.setStatsLoading);
  const setError     = useAdminStore((s) => s.setStatsError);

  // Fetch only if AdminLayout didn't already populate the store
  useEffect(() => {
    if (stats || loading) return;
    setLoading(true);
    getAdminStats()
      .then((r) => setStats(r.data.data))
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load stats.'))
      .finally(() => setLoading(false));
  }, []);

  const s = stats; // shorthand

  return (
    <div className="space-y-7 max-w-7xl">

      {/* ── Page heading ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#e2e2ee] tracking-tight">Dashboard</h1>
          <p className="text-xs text-[#5a5a78] mt-0.5">
            Platform overview — BazaarBuddy
          </p>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => {
            setLoading(true);
            getAdminStats()
              .then((r) => setStats(r.data.data))
              .catch(() => {})
              .finally(() => setLoading(false));
          }}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg bg-[#18181f] border border-[#2a2a38]
                     text-[#5a5a78] hover:text-[#e2e2ee] hover:border-[#3a3a48]
                     transition-colors disabled:opacity-50"
        >
          {loading ? '⟳ Refreshing…' : '⟳ Refresh'}
        </button>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/8 border border-red-500/20
                        text-red-400 text-sm px-4 py-3 rounded-xl">
          <span>⚠️</span>
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="ml-auto text-red-400/60 hover:text-red-400 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── USERS row ── */}
      <section>
        <p className="text-[10px] font-mono text-[#5a5a78] uppercase tracking-[2px] mb-3">
          Users
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="Total Users"
            value={s?.users?.total}
            icon="👥"
            color="purple"
            loading={loading}
          />
          <StatsCard
            label="Banned Users"
            value={s?.users?.banned}
            icon="🔨"
            color="red"
            loading={loading}
          />
          <StatsCard
            label="New Today"
            value={s?.users?.newToday}
            icon="🆕"
            color="cyan"
            sub="today"
            loading={loading}
          />
          <StatsCard
            label="New This Week"
            value={s?.users?.newThisWeek}
            icon="📈"
            color="green"
            sub="7 days"
            loading={loading}
          />
        </div>
      </section>

      {/* ── ITEMS row ── */}
      <section>
        <p className="text-[10px] font-mono text-[#5a5a78] uppercase tracking-[2px] mb-3">
          Listings
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="Total Items"
            value={s?.items?.total}
            icon="📦"
            color="orange"
            loading={loading}
          />
          <StatsCard
            label="Active"
            value={s?.items?.active}
            icon="✅"
            color="green"
            loading={loading}
          />
          <StatsCard
            label="Sold"
            value={s?.items?.sold}
            icon="🏷️"
            color="purple"
            loading={loading}
          />
          <StatsCard
            label="Hidden / Flagged"
            value={s?.items?.hidden}
            icon="🫥"
            color="red"
            loading={loading}
          />
        </div>
      </section>

      {/* ── MODERATION row ── */}
      <section>
        <p className="text-[10px] font-mono text-[#5a5a78] uppercase tracking-[2px] mb-3">
          Moderation
        </p>
        <div className="grid grid-cols-2 gap-4">
          <StatsCard
            label="Pending Reports"
            value={s?.reports?.pending}
            icon="📋"
            color="yellow"
            loading={loading}
          />
          <StatsCard
            label="Pending Flags"
            value={s?.flags?.pending}
            icon="🚩"
            color="red"
            loading={loading}
          />
        </div>
      </section>

      {/* ── Category breakdown ── */}
      {!loading && s?.categoryBreakdown?.length > 0 && (
        <section>
          <p className="text-[10px] font-mono text-[#5a5a78] uppercase tracking-[2px] mb-3">
            Listings by Category
          </p>
          <div className="bg-[#13131a] border border-[#2a2a38] rounded-xl p-5 space-y-3">
            {s.categoryBreakdown.map((cat) => {
              const max = s.categoryBreakdown[0]?.count || 1;
              const pct = Math.round((cat.count / max) * 100);
              return (
                <div key={cat._id} className="flex items-center gap-4">
                  <span className="text-xs text-[#5a5a78] w-24 flex-shrink-0 truncate">
                    {cat._id}
                  </span>
                  <div className="flex-1 bg-[#1c1c2a] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#ff6b35] to-[#ff8c5a]
                                 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-[#e2e2ee] w-8 text-right flex-shrink-0">
                    {cat.count}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Category skeleton ── */}
      {loading && (
        <section>
          <p className="text-[10px] font-mono text-[#5a5a78] uppercase tracking-[2px] mb-3">
            Listings by Category
          </p>
          <div className="bg-[#13131a] border border-[#2a2a38] rounded-xl p-5 space-y-3 animate-pulse">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-3 w-20 bg-[#2a2a38] rounded flex-shrink-0" />
                <div className="flex-1 h-1.5 bg-[#2a2a38] rounded-full" />
                <div className="h-3 w-6 bg-[#2a2a38] rounded flex-shrink-0" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Bottom grid: Activity feed + Quick actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed />
        <QuickActions />
      </div>

      {/* ── New items today — detail link ── */}
      {s?.items?.newToday > 0 && (
        <div className="flex items-center justify-between bg-[#13131a] border border-[#2a2a38]
                        rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🆕</span>
            <div>
              <p className="text-sm font-semibold text-[#e2e2ee]">
                {s.items.newToday} new listing{s.items.newToday > 1 ? 's' : ''} today
              </p>
              <p className="text-xs text-[#5a5a78]">
                {s.items.newThisWeek} total this week
              </p>
            </div>
          </div>
          <Link
            to="/admin/items"
            className="text-xs text-[#ff6b35] hover:underline font-medium"
          >
            View all →
          </Link>
        </div>
      )}

    </div>
  );
}
