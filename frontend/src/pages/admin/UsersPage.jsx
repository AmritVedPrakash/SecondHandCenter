// UsersPage.jsx
// Route: /admin/users
//
// Features:
//   - Debounced search by name / email / phone
//   - Filter by banned status
//   - Paginated table
//   - Inline ban / unban from table row
//   - BanModal for ban confirmation

import { useEffect, useState, useCallback, useRef } from 'react';
import { getAllUsers, banUser, unbanUser } from '../../api/admin.api';
import UserRow  from '../../components/admin/UserRow';
import BanModal from '../../components/admin/BanModal';
import toast    from 'react-hot-toast';

export default function UsersPage() {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [banned,     setBanned]     = useState('');           // '' | 'true' | 'false'
  const [page,       setPage]       = useState(1);
  const [pagination, setPagination] = useState(null);

  const [banTarget,   setBanTarget]   = useState(null);  // user to ban
  const [banLoading,  setBanLoading]  = useState(false);

  const searchTimer = useRef(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (overridePage) => {
    setLoading(true);
    try {
      const params = { page: overridePage ?? page, limit: 20 };
      if (search.trim()) params.search = search.trim();
      if (banned)        params.banned = banned;

      const res = await getAllUsers(params);
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, search, banned]);

  useEffect(() => { fetchUsers(); }, [page, banned]);

  // Debounce search input
  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchUsers(1);
    }, 400);
  };

  // ── Ban ────────────────────────────────────────────────────────────────────
  const handleBan = async (reason) => {
    setBanLoading(true);
    try {
      await banUser(banTarget._id, reason);
      toast.success(`"${banTarget.name}" has been banned.`);
      setBanTarget(null);
      fetchUsers();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Ban failed.');
    } finally {
      setBanLoading(false);
    }
  };

  // ── Unban ──────────────────────────────────────────────────────────────────
  const handleUnban = async (user) => {
    const tid = toast.loading(`Unbanning ${user.name}…`);
    try {
      await unbanUser(user._id);
      toast.success(`"${user.name}" unbanned.`, { id: tid });
      fetchUsers();
    } catch {
      toast.error('Unban failed.', { id: tid });
    }
  };

  const COLS = ['User', 'Phone', 'Badges', 'Listings', 'Joined', 'Actions'];

  return (
    <div className="space-y-5 max-w-7xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#e2e2ee] tracking-tight">Users</h1>
          <p className="text-xs text-[#5a5a78] mt-0.5">
            {pagination?.total ?? '—'} total users registered
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3">

        {/* Search */}
        <div className="relative flex-1 min-w-56">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a78] text-sm pointer-events-none">
            🔍
          </span>
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full pl-9 pr-4 py-2 bg-[#13131a] border border-[#2a2a38] rounded-xl
                       text-sm text-[#e2e2ee] placeholder-[#3a3a52]
                       focus:border-[#ff6b35]/50 focus:outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a5a78]
                         hover:text-[#e2e2ee] text-xs transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Banned filter */}
        <select
          value={banned}
          onChange={(e) => { setBanned(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-[#13131a] border border-[#2a2a38] rounded-xl
                     text-sm text-[#e2e2ee] focus:border-[#ff6b35]/50 focus:outline-none
                     transition-colors cursor-pointer"
        >
          <option value="">All Users</option>
          <option value="false">Active Only</option>
          <option value="true">Banned Only</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div className="bg-[#13131a] border border-[#2a2a38] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">

            {/* Head */}
            <thead>
              <tr className="border-b border-[#2a2a38] bg-[#0d0d11]">
                {COLS.map((col) => (
                  <th key={col}
                    className="px-4 py-3 text-left text-[10px] font-mono text-[#5a5a78]
                               uppercase tracking-widest whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-[#1c1c2a] animate-pulse">
                    {COLS.map((c) => (
                      <td key={c} className="px-4 py-4">
                        <div className="h-3.5 bg-[#1c1c2a] rounded-lg" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={COLS.length}
                    className="px-4 py-14 text-center">
                    <p className="text-3xl mb-2">👤</p>
                    <p className="text-sm text-[#5a5a78]">
                      {search || banned ? 'No users match your filters.' : 'No users yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <UserRow
                    key={u._id}
                    user={u}
                    onBan={(user) => setBanTarget(user)}
                    onUnban={handleUnban}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3
                          border-t border-[#2a2a38] bg-[#0d0d11]">
            <span className="text-xs text-[#5a5a78] font-mono">
              {pagination.total} users &nbsp;·&nbsp; page {page} / {pagination.pages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg bg-[#1c1c2a] text-[#a0a0b8]
                           disabled:opacity-30 hover:bg-[#2a2a38] hover:text-[#e2e2ee]
                           transition-colors border border-[#2a2a38]"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-3 py-1.5 text-xs rounded-lg bg-[#1c1c2a] text-[#a0a0b8]
                           disabled:opacity-30 hover:bg-[#2a2a38] hover:text-[#e2e2ee]
                           transition-colors border border-[#2a2a38]"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ban modal */}
      {banTarget && (
        <BanModal
          user={banTarget}
          onConfirm={handleBan}
          onCancel={() => setBanTarget(null)}
          loading={banLoading}
        />
      )}

    </div>
  );
}
