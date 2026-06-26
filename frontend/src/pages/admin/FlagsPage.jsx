// FlagsPage.jsx
// Route: /admin/flags
//
// Shows content flags raised by Cloudinary AWS Rekognition moderation.
// Features:
//   - Tab bar: Pending / Confirmed / Dismissed / All
//   - Flagged photo thumbnail + flag type + confidence score
//   - Quick resolve inline (no need to open detail)
//   - Click "Full Review" to go to FlagDetailPage for thorough review

import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams }      from 'react-router-dom';
import { getAllFlags, resolveFlag }          from '../../api/admin.api';
import toast from 'react-hot-toast';

// ── Config ─────────────────────────────────────────────────────────────────────
const TABS = [
  { value: 'pending',             label: 'Pending',    icon: '⏳' },
  { value: 'confirmed_violation', label: 'Confirmed',  icon: '🚩' },
  { value: 'false_positive',      label: 'Dismissed',  icon: '✓'  },
  { value: '',                    label: 'All',        icon: '☰'  },
];

const FLAG_CHIP = {
  explicit:   'bg-red-500/10    text-red-400    border-red-500/20',
  suggestive: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  violence:   'bg-red-500/10    text-red-400    border-red-500/20',
  gore:       'bg-red-500/10    text-red-400    border-red-500/20',
  spam:       'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  other:      'bg-[#1c1c2a]     text-[#5a5a78]  border-[#2a2a38]',
};

const STATUS_PILL = {
  pending:             'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmed_violation: 'bg-red-500/10    text-red-400    border-red-500/20',
  false_positive:      'bg-green-500/10  text-green-400  border-green-500/20',
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
export default function FlagsPage() {
  const navigate              = useNavigate();
  const [searchParams]        = useSearchParams();

  const [flags,       setFlags]       = useState([]);
  const [counts,      setCounts]      = useState({});
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState(
    searchParams.get('status') || 'pending'
  );
  const [page,        setPage]        = useState(1);
  const [pagination,  setPagination]  = useState(null);
  const [resolving,   setResolving]   = useState(''); // flagId + decision

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchFlags = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (activeTab) params.status = activeTab;

      const res = await getAllFlags(params);
      setFlags(res.data.data);
      setCounts(res.data.counts || {});
      setPagination(res.data.pagination);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to load flags.';
      toast.error(msg);
      console.error('FlagsPage load error:', e);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => { fetchFlags(); }, [fetchFlags]);

  // ── Quick resolve ──────────────────────────────────────────────────────────
  const handleQuickResolve = async (flagId, decision) => {
    setResolving(flagId + decision);
    try {
      await resolveFlag(flagId, decision, '');
      toast.success(
        decision === 'confirmed_violation'
          ? '🚩 Violation confirmed. Item removed from feed.'
          : '✓ Dismissed as false positive. Item restored.'
      );
      fetchFlags();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed.');
    } finally {
      setResolving('');
    }
  };

  const tabCount = (val) => {
    if (val === 'pending')             return counts.pending    || 0;
    if (val === 'confirmed_violation') return counts.confirmed  || 0;
    if (val === 'false_positive')      return counts.dismissed  || 0;
    return null;
  };

  return (
    <div className="space-y-5 max-w-5xl">

      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-extrabold text-[#e2e2ee] tracking-tight">Content Flags</h1>
        <p className="text-xs text-[#5a5a78] mt-0.5">
          Auto-detected by Cloudinary AWS Rekognition on every item photo upload.
        </p>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 p-1 bg-[#13131a] border border-[#2a2a38] rounded-xl">
        {TABS.map((tab) => {
          const cnt = tabCount(tab.value);
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => { setActiveTab(tab.value); setPage(1); }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2
                          rounded-lg text-xs font-semibold transition-all
                          ${isActive
                            ? 'bg-[#ff6b35] text-white shadow-sm'
                            : 'text-[#5a5a78] hover:text-[#e2e2ee]'
                          }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {cnt > 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full min-w-[20px]
                                  text-center leading-none
                                  ${isActive ? 'bg-white/20' : 'bg-[#2a2a38] text-[#5a5a78]'}`}>
                  {cnt > 99 ? '99+' : cnt}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Flag list ── */}
      <div className="space-y-3">

        {/* Loading skeletons */}
        {loading && Array(5).fill(0).map((_, i) => (
          <div key={i} className="h-28 bg-[#13131a] border border-[#2a2a38] rounded-xl animate-pulse" />
        ))}

        {/* Empty state */}
        {!loading && flags.length === 0 && (
          <div className="py-20 text-center bg-[#13131a] border border-[#2a2a38] rounded-xl">
            <p className="text-5xl mb-3">
              {activeTab === 'pending' ? '✅' : '📭'}
            </p>
            <p className="font-semibold text-[#e2e2ee] mb-1">
              {activeTab === 'pending' ? 'No pending flags' : 'No flags found'}
            </p>
            <p className="text-xs text-[#5a5a78]">
              {activeTab === 'pending'
                ? 'All content flags have been reviewed.'
                : 'Try a different tab.'
              }
            </p>
          </div>
        )}

        {/* Flag cards */}
        {!loading && flags.map((flag) => (
          <div
            key={flag._id}
            className="bg-[#13131a] border border-[#2a2a38] rounded-xl overflow-hidden
                       hover:border-[#3a3a48] transition-colors"
          >
            {/* Red left accent for pending */}
            {flag.status === 'pending' && (
              <div className="h-full w-0.5 bg-red-500 absolute left-0 top-0" />
            )}

            <div className="p-4">
              <div className="flex gap-4">

                {/* Flagged photo thumbnail */}
                {flag.photoUrl && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0
                                  border border-red-500/25 bg-[#0f0f13]">
                    <img
                      src={flag.photoUrl}
                      className="w-full h-full object-cover"
                      alt="Flagged"
                    />
                  </div>
                )}

                {/* Flag info */}
                <div className="flex-1 min-w-0">

                  {/* Row 1: type chip + confidence + time */}
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold
                                      capitalize ${FLAG_CHIP[flag.flagType] || FLAG_CHIP.other}`}>
                      {flag.flagType}
                    </span>
                    <span className="text-[10px] font-mono text-[#5a5a78]">
                      {Math.round((flag.confidence ?? 0) * 100)}% confidence
                    </span>
                    <span className="text-[10px] text-[#5a5a78] ml-auto">
                      {timeAgo(flag.createdAt)}
                    </span>
                  </div>

                  {/* Row 2: item title */}
                  <p className="text-sm font-semibold text-[#e2e2ee] truncate">
                    {flag.item?.title || 'Item deleted'}
                  </p>

                  {/* Row 3: owner */}
                  <p className="text-xs text-[#5a5a78] mt-0.5">
                    Owner:{' '}
                    <span className="text-[#a0a0b8]">{flag.owner?.name}</span>
                    <span className="text-[#2a2a38] mx-1">·</span>
                    {flag.owner?.email}
                    {flag.owner?.isBanned && (
                      <span className="ml-1.5 text-[10px] bg-red-500/10 text-red-400
                                       border border-red-500/20 px-1.5 py-0.5 rounded-full">
                        Banned
                      </span>
                    )}
                  </p>

                  {/* Row 4: action buttons */}
                  <div className="flex items-center gap-2 mt-3">

                    {/* Full review button — always visible */}
                    <button
                      onClick={() => navigate(`/admin/flags/${flag._id}`)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-[#1c1c2a] text-[#a0a0b8]
                                 hover:bg-[#2a2a38] hover:text-[#e2e2ee] transition-colors
                                 border border-[#2a2a38]"
                    >
                      Full Review →
                    </button>

                    {/* Quick resolve — only for pending */}
                    {flag.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleQuickResolve(flag._id, 'confirmed_violation')}
                          disabled={!!resolving}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white
                                     hover:bg-red-700 transition-colors font-semibold
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resolving === flag._id + 'confirmed_violation'
                            ? '…'
                            : '🚩 Confirm'
                          }
                        </button>
                        <button
                          onClick={() => handleQuickResolve(flag._id, 'false_positive')}
                          disabled={!!resolving}
                          className="text-xs px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400
                                     border border-green-500/20 hover:bg-green-500/18 transition-colors
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resolving === flag._id + 'false_positive'
                            ? '…'
                            : '✓ Dismiss'
                          }
                        </button>
                      </>
                    )}

                    {/* Already resolved badge */}
                    {flag.status !== 'pending' && (
                      <span className={`text-[10px] px-2 py-1 rounded-full border font-semibold
                                        ${STATUS_PILL[flag.status] || ''}`}>
                        {flag.status === 'confirmed_violation'
                          ? '🚩 Confirmed'
                          : '✓ Dismissed'
                        }
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pagination ── */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#5a5a78] font-mono">
            {pagination.total} flags &nbsp;·&nbsp; page {page} / {pagination.pages}
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