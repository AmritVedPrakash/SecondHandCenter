// UserDetailPage.jsx
// Route: /admin/users/:userId
//
// Shows:
//   - Full user profile card with all actions (ban/unban/verify/makeAdmin/revokeAdmin)
//   - Their active listings (last 20)
//   - Content flags on their account
//   - Admin history logs for this user

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getUserDetail,
  banUser, unbanUser,
  verifyStudent,
  makeAdmin, revokeAdmin,
} from '../../api/admin.api';
import BanModal from '../../components/admin/BanModal';
import toast    from 'react-hot-toast';

// ── Helpers ────────────────────────────────────────────────────────────────────
const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

const timeAgo = (d) => {
  const days = Math.floor((Date.now() - new Date(d)) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
};

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ title, count, accent, children }) {
  return (
    <div className={`bg-[#13131a] rounded-xl overflow-hidden
                     border ${accent ? 'border-red-500/20' : 'border-[#2a2a38]'}`}>
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

// ── Action button ──────────────────────────────────────────────────────────────
function ActionBtn({ onClick, disabled, color, children }) {
  const colors = {
    red:    'bg-red-500/8    text-red-400    border-red-500/20    hover:bg-red-500/15',
    green:  'bg-green-500/8  text-green-400  border-green-500/20  hover:bg-green-500/15',
    purple: 'bg-purple-500/8 text-purple-400 border-purple-500/20 hover:bg-purple-500/15',
    yellow: 'bg-yellow-500/8 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/15',
    gray:   'bg-[#1c1c2a]    text-[#5a5a78]  border-[#2a2a38]    hover:bg-[#2a2a38]',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed ${colors[color]}`}
    >
      {children}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function UserDetailPage() {
  const { userId } = useParams();
  const navigate   = useNavigate();

  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [banModal,   setBanModal]   = useState(false);
  const [banLoading, setBanLoading] = useState(false);
  const [busy,       setBusy]       = useState('');   // which action button is loading

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await getUserDetail(userId);
      setData(res.data.data);
    } catch {
      toast.error('User not found.');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [userId]);

  if (loading) {
    return (
      <div className="space-y-5 max-w-4xl animate-pulse">
        <div className="h-5 w-28 bg-[#2a2a38] rounded" />
        <div className="h-44 bg-[#13131a] border border-[#2a2a38] rounded-xl" />
        <div className="h-60 bg-[#13131a] border border-[#2a2a38] rounded-xl" />
      </div>
    );
  }

  if (!data) return null;
  const { user, items, flags, logs } = data;

  // ── Action handlers ────────────────────────────────────────────────────────
  const handleBan = async (reason) => {
    setBanLoading(true);
    try {
      await banUser(userId, reason);
      toast.success(`"${user.name}" banned.`);
      setBanModal(false);
      fetchDetail();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed.');
    } finally {
      setBanLoading(false);
    }
  };

  const handleUnban = async () => {
    setBusy('unban');
    try {
      await unbanUser(userId);
      toast.success('User unbanned.');
      fetchDetail();
    } catch { toast.error('Failed.'); }
    finally { setBusy(''); }
  };

  const handleVerifyStudent = async () => {
    setBusy('student');
    try {
      await verifyStudent(userId);
      toast.success('🎓 Student badge granted.');
      fetchDetail();
    } catch { toast.error('Failed.'); }
    finally { setBusy(''); }
  };

  const handleMakeAdmin = async () => {
    if (!window.confirm(`Grant admin access to ${user.name}? This gives full admin panel access.`)) return;
    setBusy('makeAdmin');
    try {
      await makeAdmin(userId);
      toast.success(`"${user.name}" is now an admin.`);
      fetchDetail();
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed.'); }
    finally { setBusy(''); }
  };

  const handleRevokeAdmin = async () => {
    if (!window.confirm(`Remove admin access from ${user.name}?`)) return;
    setBusy('revokeAdmin');
    try {
      await revokeAdmin(userId);
      toast.success('Admin access revoked.');
      fetchDetail();
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed.'); }
    finally { setBusy(''); }
  };

  const confirmedFlagCount = flags?.filter((f) => f.status === 'confirmed_violation').length ?? 0;

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Back ── */}
      <button
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-1.5 text-xs text-[#5a5a78] hover:text-[#e2e2ee]
                   transition-colors"
      >
        ← Back to Users
      </button>

      {/* ── Profile card ── */}
      <div className="bg-[#13131a] border border-[#2a2a38] rounded-xl overflow-hidden">

        {/* Coloured top strip */}
        <div className={`h-0.5 w-full bg-gradient-to-r
          ${user.isBanned
            ? 'from-red-600 via-red-500'
            : user.isAdmin
              ? 'from-yellow-500 via-yellow-400'
              : 'from-[#ff6b35] via-[#ff8c5a]'
          } to-transparent`}
        />

        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">

            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-[#ff6b35]/15 border border-[#ff6b35]/25
                            flex items-center justify-center text-2xl font-black text-[#ff6b35]
                            flex-shrink-0 overflow-hidden">
              {user.avatar
                ? <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                : user.name?.[0]?.toUpperCase()
              }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">

              {/* Name + badges */}
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-lg font-extrabold text-[#e2e2ee] tracking-tight">
                  {user.name}
                </h2>
                {user.isAdmin && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold
                                   bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    👑 Admin
                  </span>
                )}
                {user.isStudentVerified && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold
                                   bg-green-500/10 text-green-400 border border-green-500/20">
                    🎓 Verified
                  </span>
                )}
                {user.isBanned && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold
                                   bg-red-500/10 text-red-400 border border-red-500/20">
                    🔨 Banned
                  </span>
                )}
              </div>

              {/* Contact */}
              <p className="text-sm text-[#5a5a78]">
                {user.email}
                <span className="text-[#2a2a38] mx-1.5">·</span>
                {user.phone}
              </p>

              {/* Location + joined */}
              <p className="text-xs text-[#5a5a78] mt-0.5">
                📍 {user.locationName || 'No location'}
                <span className="text-[#2a2a38] mx-1.5">·</span>
                Joined {formatDate(user.createdAt)}
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                <span>
                  <span className="font-bold text-[#ff6b35]">{user.listingsCount ?? 0}</span>
                  <span className="text-[#5a5a78] ml-1">listings</span>
                </span>
                <span>
                  <span className="font-bold text-[#ff6b35]">
                    {user.rating?.average?.toFixed(1) ?? '0.0'}
                  </span>
                  <span className="text-[#5a5a78] ml-1">
                    ★ ({user.rating?.count ?? 0} reviews)
                  </span>
                </span>
                {confirmedFlagCount > 0 && (
                  <span>
                    <span className="font-bold text-red-400">{confirmedFlagCount}</span>
                    <span className="text-[#5a5a78] ml-1">confirmed flag{confirmedFlagCount > 1 ? 's' : ''}</span>
                  </span>
                )}
              </div>

              {/* Ban reason box */}
              {user.isBanned && (
                <div className="mt-3 bg-red-500/8 border border-red-500/15 rounded-lg px-3.5 py-2.5">
                  <p className="text-xs text-red-300/90">
                    <span className="font-semibold">Ban reason:</span> {user.banReason}
                  </p>
                  <p className="text-[10px] text-[#5a5a78] mt-0.5">
                    Banned {timeAgo(user.bannedAt)}
                  </p>
                </div>
              )}
            </div>

            {/* Action buttons column */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              {user.isBanned ? (
                <ActionBtn color="green" onClick={handleUnban} disabled={busy === 'unban'}>
                  {busy === 'unban' ? 'Unbanning…' : '✓ Unban User'}
                </ActionBtn>
              ) : (
                !user.isAdmin && (
                  <ActionBtn color="red" onClick={() => setBanModal(true)}>
                    🔨 Ban User
                  </ActionBtn>
                )
              )}

              {!user.isStudentVerified && (
                <ActionBtn color="purple" onClick={handleVerifyStudent} disabled={busy === 'student'}>
                  {busy === 'student' ? 'Verifying…' : '🎓 Verify Student'}
                </ActionBtn>
              )}

              {user.isAdmin ? (
                <ActionBtn color="yellow" onClick={handleRevokeAdmin} disabled={busy === 'revokeAdmin'}>
                  {busy === 'revokeAdmin' ? 'Revoking…' : '⛔ Revoke Admin'}
                </ActionBtn>
              ) : (
                <ActionBtn color="yellow" onClick={handleMakeAdmin} disabled={busy === 'makeAdmin'}>
                  {busy === 'makeAdmin' ? 'Granting…' : '👑 Make Admin'}
                </ActionBtn>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── Listings ── */}
      <Section title="Listings" count={items?.length ?? 0}>
        {!items?.length ? (
          <p className="text-sm text-[#5a5a78]">No listings yet.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <Link
                key={item._id}
                to={`/admin/items/${item._id}`}
                className="flex items-center gap-3 p-3 bg-[#0f0f13] rounded-xl
                           border border-[#2a2a38] hover:border-[#3a3a48] transition-colors"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#1c1c2a] flex-shrink-0">
                  {item.photos?.[0]
                    ? <img src={item.photos[0]} className="w-full h-full object-cover" alt="" />
                    : <span className="w-full h-full flex items-center justify-center text-base">📦</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#e2e2ee] truncate">{item.title}</p>
                  <p className="text-xs text-[#5a5a78]">
                    {item.category}
                    <span className="text-[#2a2a38] mx-1">·</span>
                    {formatDate(item.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-sm font-bold font-mono text-[#ff6b35]">
                    {item.isFree ? 'FREE' : `₹${item.price?.toLocaleString('en-IN')}`}
                  </span>
                  {item.isHidden && (
                    <span className="text-[10px] bg-red-500/10 text-red-400
                                     border border-red-500/15 px-1.5 py-0.5 rounded-full">
                      Hidden
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* ── Content Flags ── */}
      {flags?.length > 0 && (
        <Section title="⚠️ Content Flags" count={flags.length} accent>
          <div className="space-y-2.5">
            {flags.map((f) => (
              <div key={f._id}
                className="flex items-center justify-between p-3 bg-red-500/5
                           border border-red-500/10 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-[#e2e2ee] capitalize">
                    {f.flagType} — photo #{(f.photoIndex ?? 0) + 1}
                  </p>
                  <p className="text-xs text-[#5a5a78] mt-0.5">
                    {Math.round((f.confidence ?? 0) * 100)}% confidence
                    <span className="text-[#2a2a38] mx-1">·</span>
                    {formatDate(f.createdAt)}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-semibold flex-shrink-0 ml-3
                  ${f.status === 'pending'              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : ''}
                  ${f.status === 'confirmed_violation'  ? 'bg-red-500/10    text-red-400    border border-red-500/20'    : ''}
                  ${f.status === 'false_positive'       ? 'bg-green-500/10  text-green-400  border border-green-500/20'  : ''}`}>
                  {f.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Admin History ── */}
      {logs?.length > 0 && (
        <Section title="Admin History" count={logs.length}>
          <div className="space-y-0">
            {logs.map((log, i) => (
              <div key={log._id}
                className={`flex items-start justify-between py-3
                            ${i < logs.length - 1 ? 'border-b border-[#1c1c2a]' : ''}`}>
                <div>
                  <p className="text-sm text-[#e2e2ee] font-mono">
                    {log.action.replace(/_/g, ' ')}
                  </p>
                  {log.note && (
                    <p className="text-xs text-[#5a5a78] mt-0.5 italic">{log.note}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-xs text-[#5a5a78]">by {log.admin?.name}</p>
                  <p className="text-[10px] text-[#3a3a52] mt-0.5">{timeAgo(log.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Ban modal */}
      {banModal && (
        <BanModal
          user={user}
          onConfirm={handleBan}
          onCancel={() => setBanModal(false)}
          loading={banLoading}
        />
      )}

    </div>
  );
}
