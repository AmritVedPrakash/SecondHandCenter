// AdminItemDetailPage.jsx
// Route: /admin/items/:itemId
//
// Shows:
//   - Photo carousel + full item details + moderation status
//   - Owner card with link to user profile
//   - Hide / Restore / Delete actions
//   - All content flags on this item
//   - All user reports on this item

import { useEffect, useState }        from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getAdminItem,
  hideItem,
  showItem,
  deleteAdminItem,
} from '../../api/admin.api';
import ModerationBadge from '../../components/admin/ModerationBadge';
import toast           from 'react-hot-toast';

// ── Helpers ────────────────────────────────────────────────────────────────────
const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const timeAgo = (d) => {
  const days = Math.floor((Date.now() - new Date(d)) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
};

// ── Flag type colors ───────────────────────────────────────────────────────────
const FLAG_COLORS = {
  explicit:   { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/20'    },
  suggestive: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  violence:   { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/20'    },
  gore:       { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/20'    },
  spam:       { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  other:      { bg: 'bg-[#1c1c2a]',    text: 'text-[#5a5a78]',  border: 'border-[#2a2a38]'    },
};

// ── Tiny section wrapper ───────────────────────────────────────────────────────
function Section({ title, count, accent, children }) {
  return (
    <div className={`rounded-xl overflow-hidden bg-[#13131a] border
                     ${accent ? 'border-red-500/20' : 'border-[#2a2a38]'}`}>
      <div className={`px-5 py-3.5 border-b flex items-center gap-2
                       ${accent ? 'border-red-500/15 bg-red-500/5' : 'border-[#2a2a38]'}`}>
        <h3 className={`font-bold text-sm ${accent ? 'text-red-400' : 'text-[#e2e2ee]'}`}>
          {title}
        </h3>
        {count !== undefined && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full
                           bg-[#0f0f13] text-[#5a5a78] border border-[#2a2a38]">
            {count}
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function AdminItemDetailPage() {
  const { itemId } = useParams();
  const navigate   = useNavigate();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy,    setBusy]    = useState('');         // 'hide' | 'show' | 'delete'
  const [photo,   setPhoto]   = useState(0);          // active photo index

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchItem = async () => {
    setLoading(true);
    try {
      const res = await getAdminItem(itemId);
      setData(res.data.data);
      setPhoto(0);
    } catch {
      toast.error('Item not found.');
      navigate('/admin/items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItem(); }, [itemId]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleHide = async () => {
    const reason = window.prompt(
      'Reason for hiding this item?',
      'Violates content policy.'
    );
    if (reason === null) return;

    setBusy('hide');
    const tid = toast.loading('Hiding item…');
    try {
      await hideItem(itemId, reason || 'Hidden by admin.');
      toast.success('Item hidden from feed.', { id: tid });
      fetchItem();
    } catch {
      toast.error('Failed.', { id: tid });
    } finally {
      setBusy('');
    }
  };

  const handleShow = async () => {
    setBusy('show');
    const tid = toast.loading('Restoring item…');
    try {
      await showItem(itemId);
      toast.success('Item restored to feed.', { id: tid });
      fetchItem();
    } catch {
      toast.error('Failed.', { id: tid });
    } finally {
      setBusy('');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Permanently delete "${data?.item?.title}"?\n\nThis cannot be undone.`)) return;

    setBusy('delete');
    const tid = toast.loading('Deleting…');
    try {
      await deleteAdminItem(itemId, 'Permanently deleted by admin.');
      toast.success('Item deleted.', { id: tid });
      navigate('/admin/items');
    } catch {
      toast.error('Failed.', { id: tid });
      setBusy('');
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-5 max-w-5xl animate-pulse">
        <div className="h-4 w-28 bg-[#2a2a38] rounded" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-72 bg-[#13131a] border border-[#2a2a38] rounded-xl" />
          <div className="space-y-3">
            <div className="h-6 w-3/4 bg-[#2a2a38] rounded" />
            <div className="h-8 w-24 bg-[#2a2a38] rounded" />
            <div className="h-4 w-full bg-[#1c1c2a] rounded" />
            <div className="h-4 w-5/6 bg-[#1c1c2a] rounded" />
            <div className="h-4 w-2/3 bg-[#1c1c2a] rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { item, flags, reports } = data;
  const photos = item.photos || [];

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Back ── */}
      <button
        onClick={() => navigate('/admin/items')}
        className="flex items-center gap-1.5 text-xs text-[#5a5a78]
                   hover:text-[#e2e2ee] transition-colors"
      >
        ← Back to Items
      </button>

      {/* ── Main card ── */}
      <div className="bg-[#13131a] border border-[#2a2a38] rounded-xl overflow-hidden">

        {/* Top accent strip */}
        <div className={`h-0.5 bg-gradient-to-r to-transparent
          ${item.moderationStatus === 'removed' || item.moderationStatus === 'flagged'
            ? 'from-red-600 via-red-500'
            : item.moderationStatus === 'under_review'
              ? 'from-yellow-500 via-yellow-400'
              : 'from-[#ff6b35] via-[#ff8c5a]'
          }`}
        />

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">

            {/* ── Left: Photos ── */}
            <div>
              {/* Main photo */}
              <div className="relative h-64 bg-[#0f0f13] rounded-xl overflow-hidden border border-[#2a2a38]">
                {photos.length > 0 ? (
                  <img
                    src={photos[photo]}
                    className="w-full h-full object-contain"
                    alt=""
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <span className="text-5xl mb-2">📦</span>
                    <p className="text-xs text-[#5a5a78]">No photos</p>
                  </div>
                )}

                {/* Photo count */}
                {photos.length > 1 && (
                  <span className="absolute bottom-2 right-2 text-[10px] font-mono
                                   bg-black/60 text-white px-2 py-0.5 rounded-full">
                    {photo + 1} / {photos.length}
                  </span>
                )}

                {/* Prev / Next arrows */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setPhoto((p) => Math.max(0, p - 1))}
                      disabled={photo === 0}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7
                                 bg-black/50 hover:bg-black/70 text-white rounded-full
                                 flex items-center justify-center text-sm transition-colors
                                 disabled:opacity-30"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => setPhoto((p) => Math.min(photos.length - 1, p + 1))}
                      disabled={photo === photos.length - 1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7
                                 bg-black/50 hover:bg-black/70 text-white rounded-full
                                 flex items-center justify-center text-sm transition-colors
                                 disabled:opacity-30"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {photos.length > 1 && (
                <div className="flex gap-2 mt-2">
                  {photos.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setPhoto(i)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors flex-shrink-0
                                  ${i === photo
                                    ? 'border-[#ff6b35]'
                                    : 'border-[#2a2a38] hover:border-[#3a3a48]'
                                  }`}
                    >
                      <img src={url} className="w-full h-full object-cover" alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Right: Details ── */}
            <div className="space-y-4">

              {/* Title + moderation badge */}
              <div className="flex items-start gap-3">
                <h2 className="text-xl font-extrabold text-[#e2e2ee] leading-tight flex-1">
                  {item.title}
                </h2>
                <ModerationBadge status={item.moderationStatus} size="md" />
              </div>

              {/* Price */}
              <p className="text-2xl font-black font-mono text-[#ff6b35]">
                {item.isFree ? 'FREE' : `₹${item.price?.toLocaleString('en-IN')}`}
              </p>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <p className="text-[10px] text-[#5a5a78] uppercase tracking-wider mb-0.5">Category</p>
                  <p className="text-[#e2e2ee]">{item.category}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#5a5a78] uppercase tracking-wider mb-0.5">Location</p>
                  <p className="text-[#e2e2ee]">{item.locationName || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#5a5a78] uppercase tracking-wider mb-0.5">Status</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[#e2e2ee]">{item.status}</p>
                    {item.isHidden && (
                      <span className="text-[10px] text-red-400 bg-red-500/10
                                       border border-red-500/20 px-1.5 py-0.5 rounded-full">
                        Hidden
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-[#5a5a78] uppercase tracking-wider mb-0.5">Views</p>
                  <p className="text-[#e2e2ee]">{item.views ?? 0}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-[#5a5a78] uppercase tracking-wider mb-0.5">Posted</p>
                  <p className="text-[#e2e2ee]">{formatDate(item.createdAt)}</p>
                </div>
              </div>

              {/* Description */}
              {item.description && (
                <div>
                  <p className="text-[10px] text-[#5a5a78] uppercase tracking-wider mb-1">Description</p>
                  <p className="text-sm text-[#a0a0b8] leading-relaxed">{item.description}</p>
                </div>
              )}

              {/* Moderation note */}
              {item.moderationNote && (
                <div className="bg-yellow-500/8 border border-yellow-500/15 rounded-lg px-3.5 py-2.5">
                  <p className="text-xs text-yellow-400">
                    <span className="font-semibold">Admin note: </span>
                    {item.moderationNote}
                  </p>
                </div>
              )}

              {/* Owner card */}
              <div className="bg-[#0f0f13] border border-[#2a2a38] rounded-xl p-4">
                <p className="text-[10px] text-[#5a5a78] uppercase tracking-wider mb-2">Owner</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#ff6b35]/15 border border-[#ff6b35]/20
                                  flex items-center justify-center text-sm font-bold text-[#ff6b35]
                                  overflow-hidden flex-shrink-0">
                    {item.owner?.avatar
                      ? <img src={item.owner.avatar} className="w-full h-full object-cover" alt="" />
                      : item.owner?.name?.[0]?.toUpperCase()
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#e2e2ee] truncate">
                      {item.owner?.name}
                    </p>
                    <p className="text-xs text-[#5a5a78] truncate">{item.owner?.email}</p>
                  </div>
                  {item.owner?.isBanned && (
                    <span className="text-[10px] bg-red-500/10 text-red-400
                                     border border-red-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
                      Banned
                    </span>
                  )}
                </div>
                <Link
                  to={`/admin/users/${item.owner?._id}`}
                  className="mt-2.5 block text-xs text-[#ff6b35] hover:underline"
                >
                  View owner profile →
                </Link>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-1">
                {item.isHidden ? (
                  <button
                    onClick={handleShow}
                    disabled={busy === 'show'}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold
                               bg-green-500/10 text-green-400 border border-green-500/20
                               hover:bg-green-500/18 transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {busy === 'show' ? 'Restoring…' : '♻️ Restore to Feed'}
                  </button>
                ) : (
                  <button
                    onClick={handleHide}
                    disabled={busy === 'hide'}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold
                               bg-orange-500/10 text-orange-400 border border-orange-500/20
                               hover:bg-orange-500/18 transition-colors
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {busy === 'hide' ? 'Hiding…' : '🫥 Hide from Feed'}
                  </button>
                )}

                <button
                  onClick={handleDelete}
                  disabled={!!busy}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold
                             bg-red-600 text-white hover:bg-red-700 transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy === 'delete' ? 'Deleting…' : '🗑️ Delete Permanently'}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Content Flags ── */}
      {flags?.length > 0 && (
        <Section title="⚠️ Content Flags" count={flags.length} accent>
          <div className="space-y-3">
            {flags.map((f) => {
              const fc = FLAG_COLORS[f.flagType] || FLAG_COLORS.other;
              return (
                <div key={f._id}
                  className="p-4 bg-[#0f0f13] border border-red-500/10 rounded-xl">

                  {/* Flag header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold
                                      capitalize ${fc.bg} ${fc.text} ${fc.border}`}>
                      {f.flagType}
                    </span>
                    <span className="text-xs text-[#5a5a78]">
                      Photo #{(f.photoIndex ?? 0) + 1}
                    </span>
                    <span className="text-xs text-[#5a5a78]">
                      · {Math.round((f.confidence ?? 0) * 100)}% confidence
                    </span>
                    <span className="text-xs text-[#5a5a78] ml-auto">
                      {timeAgo(f.createdAt)}
                    </span>
                  </div>

                  {/* Flag status + photo + actions */}
                  <div className="flex items-start gap-4">
                    {f.photoUrl && (
                      <img
                        src={f.photoUrl}
                        className="w-20 h-20 object-cover rounded-lg border border-red-500/20 flex-shrink-0"
                        alt=""
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border
                          ${f.status === 'pending'
                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                              : f.status === 'confirmed_violation'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-green-500/10 text-green-400 border-green-500/20'
                          }`}>
                          {f.status.replace(/_/g, ' ')}
                        </span>
                        {f.adminNote && (
                          <span className="text-xs text-[#5a5a78] italic truncate">
                            "{f.adminNote}"
                          </span>
                        )}
                      </div>

                      {f.reviewedBy && (
                        <p className="text-xs text-[#5a5a78]">
                          Reviewed by {f.reviewedBy?.name} · {timeAgo(f.reviewedAt)}
                        </p>
                      )}

                      {f.status === 'pending' && (
                        <Link
                          to={`/admin/flags/${f._id}`}
                          className="mt-1.5 inline-block text-xs text-[#ff6b35] hover:underline"
                        >
                          Review this flag →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ── User Reports ── */}
      {reports?.length > 0 && (
        <Section title="📋 User Reports" count={reports.length}>
          <div className="space-y-2.5">
            {reports.map((r) => (
              <div key={r._id}
                className="flex items-start justify-between gap-4 p-3.5
                           bg-[#0f0f13] border border-[#2a2a38] rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#e2e2ee] leading-snug">{r.reason}</p>
                  <p className="text-xs text-[#5a5a78] mt-1">
                    Reported by{' '}
                    <Link
                      to={`/admin/users/${r.reporter?._id}`}
                      className="text-[#a0a0b8] hover:text-[#e2e2ee] transition-colors"
                    >
                      {r.reporter?.name}
                    </Link>
                    <span className="text-[#2a2a38] mx-1">·</span>
                    {timeAgo(r.createdAt)}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-semibold
                                  border flex-shrink-0
                  ${r.status === 'pending'
                      ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      : r.status === 'reviewed'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-green-500/10 text-green-400 border-green-500/20'
                  }`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

    </div>
  );
}