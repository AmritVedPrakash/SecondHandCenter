// ReportsPage.jsx
// Route: /admin/reports
//
// Shows user-submitted reports (spam, fake listings, etc.)
// Features:
//   - Tab bar: Pending / Reviewed / Resolved / All
//   - Inline status update (mark reviewed / resolved)
//   - Links to reported item and reporter's profile

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link }            from 'react-router-dom';
import { getAllReports, updateReportStatus } from '../../api/admin.api';
import toast from 'react-hot-toast';

// ── Tabs ───────────────────────────────────────────────────────────────────────
const TABS = [
  { value: 'pending',  label: 'Pending',  icon: '⏳' },
  { value: 'reviewed', label: 'Reviewed', icon: '👀' },
  { value: 'resolved', label: 'Resolved', icon: '✅' },
  { value: '',         label: 'All',      icon: '☰'  },
];

// ── Status pill config ─────────────────────────────────────────────────────────
const STATUS_STYLE = {
  pending:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  reviewed: 'bg-blue-500/10   text-blue-400   border-blue-500/20',
  resolved: 'bg-green-500/10  text-green-400  border-green-500/20',
};

// ── Next status map ────────────────────────────────────────────────────────────
const NEXT_STATUS = {
  pending:  { value: 'reviewed', label: '👀 Mark Reviewed', color: 'text-blue-400   bg-blue-500/8   border-blue-500/15   hover:bg-blue-500/15'   },
  reviewed: { value: 'resolved', label: '✅ Mark Resolved', color: 'text-green-400  bg-green-500/8  border-green-500/15  hover:bg-green-500/15'  },
};

const timeAgo = (d) => {
  const m = Math.floor((Date.now() - new Date(d)) / 60_000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [searchParams]  = useSearchParams();

  const [reports,     setReports]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState(
    searchParams.get('status') || 'pending'
  );
  const [page,        setPage]        = useState(1);
  const [pagination,  setPagination]  = useState(null);
  const [updating,    setUpdating]    = useState(''); // reportId being updated

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (activeTab) params.status = activeTab;

      const res = await getAllReports(params);
      setReports(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // ── Update status ──────────────────────────────────────────────────────────
  const handleStatusUpdate = async (reportId, newStatus) => {
    setUpdating(reportId);
    try {
      await updateReportStatus(reportId, newStatus);
      toast.success(`Report marked as ${newStatus}.`);
      fetchReports();
    } catch {
      toast.error('Failed to update report.');
    } finally {
      setUpdating('');
    }
  };

  return (
    <div className="space-y-5 max-w-4xl">

      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-extrabold text-[#e2e2ee] tracking-tight">Reports</h1>
        <p className="text-xs text-[#5a5a78] mt-0.5">
          User-submitted reports — spam, fake listings, misleading content.
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-[#13131a] border border-[#2a2a38] rounded-xl">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setPage(1); }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2
                        rounded-lg text-xs font-semibold transition-all
                        ${activeTab === tab.value
                          ? 'bg-[#ff6b35] text-white'
                          : 'text-[#5a5a78] hover:text-[#e2e2ee]'
                        }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Report list ── */}
      <div className="space-y-3">

        {/* Loading */}
        {loading && Array(6).fill(0).map((_, i) => (
          <div key={i} className="h-24 bg-[#13131a] border border-[#2a2a38] rounded-xl animate-pulse" />
        ))}

        {/* Empty */}
        {!loading && reports.length === 0 && (
          <div className="py-20 text-center bg-[#13131a] border border-[#2a2a38] rounded-xl">
            <p className="text-5xl mb-3">
              {activeTab === 'pending' ? '✅' : '📭'}
            </p>
            <p className="font-semibold text-[#e2e2ee] mb-1">
              {activeTab === 'pending' ? 'No pending reports' : 'No reports found'}
            </p>
            <p className="text-xs text-[#5a5a78]">
              {activeTab === 'pending'
                ? 'All reports have been reviewed.'
                : 'Try a different tab.'
              }
            </p>
          </div>
        )}

        {/* Report cards */}
        {!loading && reports.map((report) => {
          const next = NEXT_STATUS[report.status];
          return (
            <div
              key={report._id}
              className="bg-[#13131a] border border-[#2a2a38] rounded-xl p-4
                         hover:border-[#3a3a48] transition-colors"
            >
              <div className="flex items-start gap-4">

                {/* Item thumbnail */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#0f0f13]
                                border border-[#2a2a38] flex-shrink-0">
                  {report.item?.photos?.[0] ? (
                    <img
                      src={report.item.photos[0]}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-xl">
                      📦
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">

                  {/* Row 1: item title + status + time */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      {report.item ? (
                        <Link
                          to={`/admin/items/${report.item._id}`}
                          className="text-sm font-semibold text-[#e2e2ee] hover:text-[#ff6b35]
                                     transition-colors truncate block max-w-xs"
                        >
                          {report.item.title}
                        </Link>
                      ) : (
                        <p className="text-sm font-semibold text-[#5a5a78]">Item deleted</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold
                                        ${STATUS_STYLE[report.status] || ''}`}>
                        {report.status}
                      </span>
                      <span className="text-[10px] text-[#5a5a78]">{timeAgo(report.createdAt)}</span>
                    </div>
                  </div>

                  {/* Row 2: reason */}
                  <p className="text-sm text-[#a0a0b8] leading-snug mb-2">
                    "{report.reason}"
                  </p>

                  {/* Row 3: reporter + actions */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-[#5a5a78]">
                      Reported by{' '}
                      {report.reporter ? (
                        <Link
                          to={`/admin/users/${report.reporter._id}`}
                          className="text-[#a0a0b8] hover:text-[#e2e2ee] transition-colors"
                        >
                          {report.reporter.name}
                        </Link>
                      ) : (
                        <span className="text-[#3a3a52]">deleted user</span>
                      )}
                    </p>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* View item button */}
                      {report.item && (
                        <Link
                          to={`/admin/items/${report.item._id}`}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-[#1c1c2a] text-[#a0a0b8]
                                     hover:bg-[#2a2a38] hover:text-[#e2e2ee] transition-colors
                                     border border-[#2a2a38]"
                        >
                          View Item →
                        </Link>
                      )}

                      {/* Status advance button */}
                      {next && (
                        <button
                          onClick={() => handleStatusUpdate(report._id, next.value)}
                          disabled={updating === report._id}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors
                                      disabled:opacity-50 disabled:cursor-not-allowed ${next.color}`}
                        >
                          {updating === report._id ? '…' : next.label}
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Pagination ── */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#5a5a78] font-mono">
            {pagination.total} reports &nbsp;·&nbsp; page {page} / {pagination.pages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs rounded-lg bg-[#13131a] border border-[#2a2a38]
                         text-[#a0a0b8] disabled:opacity-30 hover:bg-[#1c1c2a] transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="px-3 py-1.5 text-xs rounded-lg bg-[#13131a] border border-[#2a2a38]
                         text-[#a0a0b8] disabled:opacity-30 hover:bg-[#1c1c2a] transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

    </div>
  );
}