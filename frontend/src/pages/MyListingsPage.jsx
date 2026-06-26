
// ─────────────────────────────────────────────────────────────────────────────
//  MyListingsPage  |  /my-listings  (protected)
//  Tabs: Active | Sold  — list view with thumbnail, edit, mark-sold, delete
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getMyItems }  from '../api/item.api';
import { useItem }     from '../hooks/useItem';
import { useAuthStore } from '../store/authStore';
import { CAT_ICONS, formatPrice, timeAgo } from '../components/items/helpers';
import Button          from '../components/ui/Button';
import ConfirmDialog   from '../components/ui/ConfirmDialog';
import EmptyState      from '../components/ui/EmptyState';
import { PageSpinner } from '../components/ui/Spinner';
import Spinner         from '../components/ui/Spinner';
import toast           from 'react-hot-toast';

// ── Single listing row ─────────────────────────────────────────────────────────
function ListingRow({ item, onDeleted, onSoldToggle }) {
  const [showDelete, setShowDelete] = useState(false);
  const { deleteItem, isDeleting, markAsSold, isMarkingSold } = useItem(item._id);

  const isSold   = item.isSold || item.status === 'sold';
  const photo    = item.photos?.[0];
  const price    = formatPrice(item.price, item.isFree);

  const handleDelete = () => {
    deleteItem();
    onDeleted(item._id);
    setShowDelete(false);
  };

  const handleMarkSold = () => {
    markAsSold();
    onSoldToggle(item._id);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity:0, y:8 }}
        animate={{ opacity:1, y:0 }}
        exit={{ opacity:0, x:-20 }}
        transition={{ duration:0.25 }}
        className="card p-4 flex items-center gap-4 hover:shadow-card-md transition-shadow"
      >
        {/* Thumbnail */}
        <Link to={`/items/${item._id}`} className="flex-shrink-0">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-cream-100 border border-cream-200 relative">
            {photo
              ? <img src={photo} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              : <div className="w-full h-full flex items-center justify-center text-2xl">{CAT_ICONS[item.category]}</div>
            }
            {isSold && (
              <div className="absolute inset-0 bg-charcoal-900/50 flex items-center justify-center rounded-xl">
                <span className="text-white text-[9px] font-black">SOLD</span>
              </div>
            )}
          </div>
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link to={`/items/${item._id}`} className="font-bold text-sm text-charcoal-800 truncate hover:text-primary-600 transition-colors block">
            {item.title}
          </Link>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-sm font-extrabold ${item.isFree ? 'text-forest-600' : 'text-charcoal-800'}`}>{price}</span>
            <span className={`badge text-xs ${isSold ? 'badge-primary' : 'bg-forest-100 text-forest-700 badge'}`}>
              {isSold ? '✓ Sold' : '● Active'}
            </span>
            <span className="text-xs text-cream-400 hidden sm:inline">{timeAgo(item.createdAt)}</span>
          </div>
          {item.locationName && (
            <p className="text-xs text-cream-400 mt-0.5 truncate">📍 {item.locationName}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link to={`/items/${item._id}/edit`}>
            <Button variant="secondary" size="sm" iconOnly title="Edit">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>
          </Link>
          {!isSold && (
            <Button variant="secondary" size="sm" loading={isMarkingSold} onClick={handleMarkSold}
              className="text-forest-600 border-forest-200 hover:bg-forest-50" title="Mark as sold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </Button>
          )}
          <Button variant="danger" size="sm" iconOnly onClick={() => setShowDelete(true)} title="Delete">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
      </motion.div>

      <ConfirmDialog
        open={showDelete} onClose={() => setShowDelete(false)}
        title="Delete this item?" message="It will be permanently removed from all listings."
        confirmLabel="Delete" loading={isDeleting} type="danger"
        onConfirm={handleDelete}
      />
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MyListingsPage() {
  const { user } = useAuthStore();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('active');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await getMyItems({ limit: 50 });
      setItems(data);
    } catch (err) {
      toast.error('Failed to load your listings.');
    } finally {
      setLoading(false);
    }
  };

  const activeItems = items.filter(i => i.status === 'active' && !i.isSold);
  const soldItems   = items.filter(i => i.isSold || i.status === 'sold');

  const handleDeleted = (id) => setItems(prev => prev.filter(i => i._id !== id));
  const handleSold    = (id) => setItems(prev => prev.map(i => i._id === id ? { ...i, isSold:true, status:'sold' } : i));

  const displayed = tab === 'active' ? activeItems : soldItems;

  if (loading) return <PageSpinner label="Loading your listings…" />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal-800 tracking-tight">My Listings</h1>
          <p className="text-sm text-cream-400 mt-0.5">{items.length} total item{items.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/items/create">
          <Button variant="primary" size="md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Post New Item
          </Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState icon="📦" title="No listings yet"
          description="Post your first item and start selling to people nearby!"
          action={<Link to="/items/create"><Button variant="primary" size="md">Post an Item</Button></Link>}
        />
      ) : (
        <>
          {/* ── Tabs ── */}
          <div className="flex items-center gap-1 p-1 bg-cream-100 rounded-xl mb-5 w-fit">
            {[
              { key:'active', label:`Active`, count: activeItems.length },
              { key:'sold',   label:`Sold`,   count: soldItems.length   },
            ].map(({ key, label, count }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  tab === key
                    ? 'bg-white text-charcoal-800 shadow-card'
                    : 'text-cream-500 hover:text-charcoal-800'
                }`}
              >
                {label}
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-black ${
                  tab === key
                    ? key === 'active' ? 'bg-forest-100 text-forest-700' : 'bg-primary-100 text-primary-700'
                    : 'bg-cream-200 text-cream-500'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* ── List ── */}
          {displayed.length === 0 ? (
            <EmptyState
              icon={tab === 'active' ? '📋' : '🎉'}
              title={tab === 'active' ? 'No active listings' : 'No sold items yet'}
              description={tab === 'active' ? 'All your items have been sold or removed.' : 'Sold items will appear here.'}
              compact
            />
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {displayed.map(item => (
                  <ListingRow key={item._id} item={item} onDeleted={handleDeleted} onSoldToggle={handleSold} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
}