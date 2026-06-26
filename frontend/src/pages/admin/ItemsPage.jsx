// ItemsPage.jsx
// Route: /admin/items
//
// Features:
//   - Search by title / description
//   - Filter by moderationStatus, category, item status
//   - Reads ?moderationStatus= from URL (QuickActions passes it)
//   - Paginated table with inline hide / restore / delete
//   - Confirm prompt before hide and delete

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate }              from 'react-router-dom';
import { getAllAdminItems, hideItem, showItem, deleteAdminItem } from '../../api/admin.api';
import ItemRow from '../../components/admin/itemRow';
import toast   from 'react-hot-toast';

const CATEGORIES = ['Electronics', 'Furniture', 'Books', 'Clothes', 'Farm Tools', 'Other'];

const MOD_FILTERS = [
  { value: '',             label: 'All'         },
  { value: 'clean',        label: '✓ Clean'     },
  { value: 'flagged',      label: '🚩 Flagged'  },
  { value: 'under_review', label: '⏳ In Review' },
  { value: 'removed',      label: '🗑️ Removed'  },
];

const STATUS_FILTERS = [
  { value: '',        label: 'All Statuses' },
  { value: 'active',  label: 'Active'       },
  { value: 'sold',    label: 'Sold'         },
  { value: 'deleted', label: 'Deleted'      },
];

export default function ItemsPage() {
  const [searchParams] = useSearchParams();
  const navigate        = useNavigate();

  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [modStatus,   setModStatus]   = useState(searchParams.get('moderationStatus') || '');
  const [itemStatus,  setItemStatus]  = useState('');
  const [category,    setCategory]    = useState('');
  const [page,        setPage]        = useState(1);
  const [pagination,  setPagination]  = useState(null);

  const searchTimer = useRef(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchItems = useCallback(async (overridePage) => {
    setLoading(true);
    try {
      const params = { page: overridePage ?? page, limit: 20 };
      if (search.trim()) params.search            = search.trim();
      if (modStatus)     params.moderationStatus  = modStatus;
      if (itemStatus)    params.status            = itemStatus;
      if (category)      params.category          = category;

      const res = await getAllAdminItems(params);
      setItems(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load items.');
    } finally {
      setLoading(false);
    }
  }, [page, search, modStatus, itemStatus, category]);

  useEffect(() => { fetchItems(); }, [page, modStatus, itemStatus, category]);

  // Debounce search
  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchItems(1);
    }, 400);
  };

  // ── Hide ───────────────────────────────────────────────────────────────────
  const handleHide = async (item) => {
    const reason = window.prompt(
      `Reason for hiding "${item.title}"?`,
      'Violates content policy.'
    );
    if (reason === null) return; // cancelled

    const tid = toast.loading('Hiding item…');
    try {
      await hideItem(item._id, reason || 'Hidden by admin.');
      toast.success('Item hidden from feed.', { id: tid });
      fetchItems();
    } catch {
      toast.error('Failed to hide item.', { id: tid });
    }
  };

  // ── Show ───────────────────────────────────────────────────────────────────
  const handleShow = async (item) => {
    const tid = toast.loading('Restoring item…');
    try {
      await showItem(item._id);
      toast.success('Item restored to feed.', { id: tid });
      fetchItems();
    } catch {
      toast.error('Failed to restore item.', { id: tid });
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (item) => {
    const ok = window.confirm(
      `Permanently delete "${item.title}"?\n\nThis cannot be undone.`
    );
    if (!ok) return;

    const tid = toast.loading('Deleting…');
    try {
      await deleteAdminItem(item._id, 'Permanently deleted by admin.');
      toast.success('Item deleted.', { id: tid });
      fetchItems();
    } catch {
      toast.error('Failed to delete item.', { id: tid });
    }
  };

  const COLS = ['Item', 'Price', 'Owner', 'Status', 'Posted', 'Actions'];

  // Active filter count for badge
  const activeFilters = [modStatus, itemStatus, category, search.trim()].filter(Boolean).length;

  return (
    <div className="space-y-5 max-w-7xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#e2e2ee] tracking-tight">Items</h1>
          <p className="text-xs text-[#5a5a78] mt-0.5">
            {pagination?.total ?? '—'} total listings
          </p>
        </div>
      </div>

      {/* ── Moderation status tabs ── */}
      <div className="flex gap-1.5 flex-wrap">
        {MOD_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setModStatus(f.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${modStatus === f.value
                          ? 'bg-[#ff6b35] text-white'
                          : 'bg-[#13131a] border border-[#2a2a38] text-[#5a5a78] hover:text-[#e2e2ee] hover:border-[#3a3a48]'
                        }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Search + extra filters ── */}
      <div className="flex flex-wrap gap-3">

        {/* Search */}
        <div className="relative flex-1 min-w-56">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a78] text-sm pointer-events-none">
            🔍
          </span>
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by title…"
            className="w-full pl-9 pr-9 py-2 bg-[#13131a] border border-[#2a2a38] rounded-xl
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

        {/* Category */}
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-[#13131a] border border-[#2a2a38] rounded-xl
                     text-sm text-[#e2e2ee] focus:border-[#ff6b35]/50 focus:outline-none
                     transition-colors cursor-pointer"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Status */}
        <select
          value={itemStatus}
          onChange={(e) => { setItemStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-[#13131a] border border-[#2a2a38] rounded-xl
                     text-sm text-[#e2e2ee] focus:border-[#ff6b35]/50 focus:outline-none
                     transition-colors cursor-pointer"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        {/* Clear filters */}
        {activeFilters > 0 && (
          <button
            onClick={() => {
              setSearch('');
              setModStatus('');
              setItemStatus('');
              setCategory('');
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl bg-red-500/8 text-red-400
                       border border-red-500/15 hover:bg-red-500/15 transition-colors"
          >
            ✕ Clear ({activeFilters})
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-[#13131a] border border-[#2a2a38] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">

            <thead>
              <tr className="border-b border-[#2a2a38] bg-[#0d0d11]">
                {COLS.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-[10px] font-mono text-[#5a5a78]
                               uppercase tracking-widest whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-[#1c1c2a] animate-pulse">
                    {COLS.map((c) => (
                      <td key={c} className="px-4 py-4">
                        <div className={`h-3.5 bg-[#1c1c2a] rounded-lg
                                         ${c === 'Item' ? 'w-36' : 'w-16'}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={COLS.length} className="px-4 py-16 text-center">
                    <p className="text-3xl mb-2">📦</p>
                    <p className="text-sm text-[#5a5a78]">
                      {activeFilters > 0 ? 'No items match your filters.' : 'No items yet.'}
                    </p>
                    {activeFilters > 0 && (
                      <button
                        onClick={() => { setSearch(''); setModStatus(''); setItemStatus(''); setCategory(''); }}
                        className="mt-3 text-xs text-[#ff6b35] hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <ItemRow
                    key={item._id}
                    item={item}
                    onHide={handleHide}
                    onShow={handleShow}
                    onDelete={handleDelete}
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
              {pagination.total} items &nbsp;·&nbsp; page {page} / {pagination.pages}
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

    </div>
  );
}