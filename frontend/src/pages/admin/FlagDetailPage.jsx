// FlagDetailPage.jsx
// Route: /admin/flags/:flagId
//
// Full review page for a single content flag.
// Shows:
//   - The flagged photo (large) + all item photos side by side
//   - Flag metadata: type, confidence, source, date
//   - Item detail card + link to item management
//   - Owner history: previous violations, ban status
//   - Resolve form: confirm or dismiss with admin note
//   - Auto-ban warning if owner is near threshold (3 flags)

import { useEffect, useState }         from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getFlagById, resolveFlag }    from '../../api/admin.api';
import ModerationBadge                 from '../../components/admin/ModerationBadge';
import toast                           from 'react-hot-toast';

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

const FLAG_CHIP = {
  explicit:   'bg-red-500/10    text-red-400    border-red-500/20',
  suggestive: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  violence:   'bg-red-500/10    text-red-400    border-red-500/20',
  gore:       'bg-red-500/10    text-red-400    border-red-500/20',
  spam:       'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  other:      'bg-[#1c1c2a]     text-[#5a5a78]  border-[#2a2a38]',
};

// ── Info row helper ────────────────────────────────────────────────────────────
function InfoRow({ label, children }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-[#1c1c2a] last:border-0">
      <span className="text-xs text-[#5a5a78] w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 text-right">{children}</div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function FlagDetailPage() {
  const { flagId } = useParams();
  const navigate   = useNavigate();

  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [decision,  setDecision]  = useState('');        // 'confirmed_violation' | 'false_positive'
  const [adminNote, setAdminNote] = useState('');
  const [resolving, setResolving] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getFlagById(flagId);
        setData(res.data);
      } catch {
        toast.error('Flag not found.');
        navigate('/admin/flags');
      } finally {
        setLoading(false);
      }
    })();
  }, [flagId]);

  // ── Resolve ────────────────────────────────────────────────────────────────
  const handleResolve = async () => {
    if (!decision) {
      toast.error('Please select a decision first.');
      return;
    }
    setResolving(true);
    try {
      await resolveFlag(flagId, decision, adminNote.trim());
      toast.success(
        decision === 'confirmed_violation'
          ? '🚩 Violation confirmed. Item removed from feed.'
          : '✓ Dismissed. Item restored to feed.'
      );
      navigate('/admin/flags');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to resolve flag.');
    } finally {
      setResolving(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-5 max-w-5xl animate-pulse">
        <div className="h-4 w-28 bg-[#2a2a38] rounded" />
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-72 bg-[#13131a] border border-[#2a2a38] rounded-xl" />
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-4 bg-[#2a2a38] rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { data: flag, ownerHistory } = data;
  const item  = flag.item;
  const owner = flag.owner;

  const isResolved      = flag.status !== 'pending';
  const willAutoBan     = ownerHistory?.willAutoBanAt;
  const prevViolations  = ownerHistory?.previousViolations ?? 0;
  const nearAutoBan     = prevViolations + 1 >= willAutoBan;

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Back ── */}
      <button
        onClick={() => navigate('/admin/flags')}
        className="flex items-center gap-1.5 text-xs text-[#5a5a78] hover:text-[#e2e2ee] transition-colors"
      >
        ← Back to Flags
      </button>

      {/* ── Page title ── */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-extrabold text-[#e2e2ee] tracking-tight">Flag Review</h1>
        <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold capitalize
                          ${FLAG_CHIP[flag.flagType] || FLAG_CHIP.other}`}>
          {flag.flagType}
        </span>
        {isResolved && (
          <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold ml-auto
                            ${flag.status === 'confirmed_violation'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-green-500/10 text-green-400 border-green-500/20'
                            }`}>
            {flag.status === 'confirmed_violation' ? '🚩 Confirmed' : '✓ Dismissed'}
          </span>
        )}
      </div>

      {/* ── Auto-ban warning ── */}
      {!isResolved && nearAutoBan && !owner?.isBanned && (
        <div className="flex gap-3 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3">
          <span className="text-lg flex-shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-bold text-red-400">Auto-ban warning</p>
            <p className="text-xs text-red-300/80 mt-0.5">
              This owner has <strong>{prevViolations}</strong> previous confirmed violation
              {prevViolations !== 1 ? 's' : ''}.
              Confirming this flag will trigger an automatic ban
              (threshold: {willAutoBan}).
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">

        {/* ── Left: Photos ── */}
        <div className="space-y-3">

          {/* Flagged photo — large */}
          <div>
            <p className="text-[10px] font-mono text-[#5a5a78] uppercase tracking-widest mb-2">
              Flagged Photo (#{(flag.photoIndex ?? 0) + 1})
            </p>
            <div className="relative rounded-xl overflow-hidden bg-[#0f0f13]
                            border-2 border-red-500/30">
              {flag.photoUrl ? (
                <img
                  src={flag.photoUrl}
                  className="w-full h-64 object-contain"
                  alt="Flagged"
                />
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-[#5a5a78] text-sm">Photo unavailable</p>
                </div>
              )}
              <div className="absolute top-2 left-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold capitalize
                                  ${FLAG_CHIP[flag.flagType] || FLAG_CHIP.other}`}>
                  {flag.flagType}
                </span>
              </div>
              <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px]
                              font-mono px-2 py-0.5 rounded-full">
                {Math.round((flag.confidence ?? 0) * 100)}% confidence
              </div>
            </div>
          </div>

          {/* All item photos */}
          {item?.photos?.length > 0 && (
            <div>
              <p className="text-[10px] font-mono text-[#5a5a78] uppercase tracking-widest mb-2">
                All Item Photos ({item.photos.length})
              </p>
              <div className="grid grid-cols-4 gap-2">
                {item.photos.map((url, i) => (
                  <div
                    key={i}
                    className={`rounded-lg overflow-hidden h-16 border
                                ${i === flag.photoIndex
                                  ? 'border-red-500/50 ring-1 ring-red-500/30'
                                  : 'border-[#2a2a38]'}`}
                  >
                    <img src={url} className="w-full h-full object-cover" alt="" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Details + resolve ── */}
        <div className="space-y-4">

          {/* Flag metadata */}
          <div className="bg-[#13131a] border border-[#2a2a38] rounded-xl p-4">
            <p className="text-[10px] font-mono text-[#5a5a78] uppercase tracking-widest mb-3">
              Flag Details
            </p>
            <InfoRow label="Flag Type">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold capitalize
                                ${FLAG_CHIP[flag.flagType] || FLAG_CHIP.other}`}>
                {flag.flagType}
              </span>
            </InfoRow>
            <InfoRow label="Confidence">
              <span className="text-sm font-mono font-bold text-[#e2e2ee]">
                {Math.round((flag.confidence ?? 0) * 100)}%
              </span>
            </InfoRow>
            <InfoRow label="Source">
              <span className="text-xs font-mono text-[#a0a0b8]">
                {flag.moderationSource === 'cloudinary' ? 'Cloudinary AWS Rek' : 'Manual'}
              </span>
            </InfoRow>
            <InfoRow label="Photo Index">
              <span className="text-xs text-[#a0a0b8]">
                Photo #{(flag.photoIndex ?? 0) + 1}
              </span>
            </InfoRow>
            <InfoRow label="Flagged">
              <span className="text-xs text-[#5a5a78]">{formatDate(flag.createdAt)}</span>
            </InfoRow>
            {isResolved && (
              <InfoRow label="Reviewed">
                <div className="text-right">
                  <p className="text-xs text-[#a0a0b8]">
                    by {flag.reviewedBy?.name}
                  </p>
                  <p className="text-[10px] text-[#5a5a78]">
                    {formatDate(flag.reviewedAt)}
                  </p>
                </div>
              </InfoRow>
            )}
          </div>

          {/* Item card */}
          {item && (
            <div className="bg-[#13131a] border border-[#2a2a38] rounded-xl p-4">
              <p className="text-[10px] font-mono text-[#5a5a78] uppercase tracking-widest mb-3">
                Item
              </p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#0f0f13]
                                border border-[#2a2a38] flex-shrink-0">
                  {item.photos?.[0]
                    ? <img src={item.photos[0]} className="w-full h-full object-cover" alt="" />
                    : <span className="w-full h-full flex items-center justify-center text-lg">📦</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#e2e2ee] truncate">{item.title}</p>
                  <p className="text-xs text-[#5a5a78]">{item.category}</p>
                </div>
                <ModerationBadge status={item.moderationStatus} />
              </div>
              <p className="text-sm font-bold font-mono text-[#ff6b35] mb-2">
                {item.isFree ? 'FREE' : `₹${item.price?.toLocaleString('en-IN')}`}
              </p>
              {item.description && (
                <p className="text-xs text-[#5a5a78] leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              )}
              <Link
                to={`/admin/items/${item._id}`}
                className="mt-2.5 block text-xs text-[#ff6b35] hover:underline"
              >
                Manage this item →
              </Link>
            </div>
          )}

          {/* Owner card */}
          {owner && (
            <div className="bg-[#13131a] border border-[#2a2a38] rounded-xl p-4">
              <p className="text-[10px] font-mono text-[#5a5a78] uppercase tracking-widest mb-3">
                Owner
              </p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#ff6b35]/15 border border-[#ff6b35]/20
                                flex items-center justify-center text-sm font-black text-[#ff6b35]
                                overflow-hidden flex-shrink-0">
                  {owner.avatar
                    ? <img src={owner.avatar} className="w-full h-full object-cover" alt="" />
                    : owner.name?.[0]?.toUpperCase()
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-[#e2e2ee] truncate">{owner.name}</p>
                    {owner.isBanned && (
                      <span className="text-[10px] bg-red-500/10 text-red-400
                                       border border-red-500/20 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        Banned
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5a5a78] truncate">{owner.email}</p>
                </div>
              </div>

              {/* Violation history */}
              <div className="flex items-center justify-between py-2 border-t border-[#1c1c2a]">
                <span className="text-xs text-[#5a5a78]">Previous violations</span>
                <span className={`text-sm font-bold ${prevViolations > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {prevViolations}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-[#1c1c2a]">
                <span className="text-xs text-[#5a5a78]">Listings count</span>
                <span className="text-sm text-[#e2e2ee]">{owner.listingsCount ?? 0}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-[#1c1c2a]">
                <span className="text-xs text-[#5a5a78]">Member since</span>
                <span className="text-xs text-[#a0a0b8]">{timeAgo(owner.createdAt)}</span>
              </div>

              <Link
                to={`/admin/users/${owner._id}`}
                className="mt-2 block text-xs text-[#ff6b35] hover:underline"
              >
                View full profile →
              </Link>
            </div>
          )}

          {/* ── Resolve form ── */}
          {!isResolved ? (
            <div className="bg-[#13131a] border border-[#ff6b35]/20 rounded-xl p-4">
              <p className="text-[10px] font-mono text-[#5a5a78] uppercase tracking-widest mb-4">
                Your Decision
              </p>

              {/* Decision cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">

                {/* Confirm violation */}
                <button
                  onClick={() => setDecision('confirmed_violation')}
                  className={`p-3.5 rounded-xl border text-left transition-all
                              ${decision === 'confirmed_violation'
                                ? 'border-red-500/50 bg-red-500/10 ring-1 ring-red-500/30'
                                : 'border-[#2a2a38] bg-[#0f0f13] hover:border-red-500/25'
                              }`}
                >
                  <p className="text-base mb-1">🚩</p>
                  <p className="text-sm font-bold text-red-400">Confirm</p>
                  <p className="text-[10px] text-[#5a5a78] mt-0.5 leading-relaxed">
                    Item removed from feed. Repeat offenders auto-banned.
                  </p>
                </button>

                {/* False positive */}
                <button
                  onClick={() => setDecision('false_positive')}
                  className={`p-3.5 rounded-xl border text-left transition-all
                              ${decision === 'false_positive'
                                ? 'border-green-500/50 bg-green-500/10 ring-1 ring-green-500/30'
                                : 'border-[#2a2a38] bg-[#0f0f13] hover:border-green-500/25'
                              }`}
                >
                  <p className="text-base mb-1">✓</p>
                  <p className="text-sm font-bold text-green-400">Dismiss</p>
                  <p className="text-[10px] text-[#5a5a78] mt-0.5 leading-relaxed">
                    False positive. Item restored to feed immediately.
                  </p>
                </button>
              </div>

              {/* Admin note */}
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add a note (optional)…"
                rows={2}
                className="w-full bg-[#0f0f13] border border-[#2a2a38] rounded-xl
                           px-3.5 py-2.5 text-sm text-[#e2e2ee] placeholder-[#3a3a52]
                           focus:border-[#ff6b35]/50 focus:outline-none resize-none
                           transition-colors mb-3"
              />

              {/* Submit */}
              <button
                onClick={handleResolve}
                disabled={!decision || resolving}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-colors
                            disabled:opacity-40 disabled:cursor-not-allowed
                            ${decision === 'confirmed_violation'
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : decision === 'false_positive'
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-[#2a2a38] text-[#5a5a78]'
                            }`}
              >
                {resolving
                  ? 'Submitting…'
                  : decision === 'confirmed_violation'
                    ? '🚩 Confirm Violation'
                    : decision === 'false_positive'
                      ? '✓ Dismiss as False Positive'
                      : 'Select a decision above'
                }
              </button>
            </div>
          ) : (
            /* Already resolved — show summary */
            <div className={`rounded-xl border p-4
                             ${flag.status === 'confirmed_violation'
                               ? 'bg-red-500/5 border-red-500/20'
                               : 'bg-green-500/5 border-green-500/20'
                             }`}>
              <p className="text-sm font-bold mb-1
                            ${flag.status === 'confirmed_violation' ? 'text-red-400' : 'text-green-400'}">
                {flag.status === 'confirmed_violation'
                  ? '🚩 Violation was confirmed'
                  : '✓ Dismissed as false positive'
                }
              </p>
              <p className="text-xs text-[#5a5a78]">
                by {flag.reviewedBy?.name} · {formatDate(flag.reviewedAt)}
              </p>
              {flag.adminNote && (
                <p className="text-xs text-[#a0a0b8] mt-1.5 italic">"{flag.adminNote}"</p>
              )}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}