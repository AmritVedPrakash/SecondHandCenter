// ─────────────────────────────────────────────────────────────────────────────
//  EditItemPage  |  /items/:id/edit  (protected, owner only)
//  Pre-fills ItemForm, calls PUT /api/items/:id
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useItem }      from '../hooks/useItem';
import { useAuthStore } from '../store/authStore';
import ItemForm         from '../components/items/ItemForm';
import { PageSpinner }  from '../components/ui/Spinner';
import Button           from '../components/ui/Button';
import toast            from 'react-hot-toast';

export default function EditItemPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuthStore();

  const { item, isLoading, isError, updateItem, isUpdating } = useItem(id);

  // Owner check after load
  useEffect(() => {
    if (!isLoading && item) {
      const ownerId = item.owner?._id || item.owner;
      if (user?._id !== ownerId?.toString() && user?._id !== ownerId) {
        toast.error('You are not authorized to edit this item.');
        navigate('/', { replace: true });
      }
    }
  }, [item, isLoading, user, navigate]);

  if (isLoading) return <PageSpinner label="Loading item…" />;

  if (isError || !item) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="text-6xl">😕</div>
        <h1 className="text-xl font-bold text-charcoal-800">Item not found</h1>
        <Link to="/my-listings"><Button variant="primary" size="md">My Listings</Button></Link>
      </div>
    );
  }

  const initialValues = {
    title:        item.title        || '',
    description:  item.description  || '',
    price:        String(item.price ?? ''),
    category:     item.category     || 'Electronics',
    condition:    item.condition    || 'Good',
    locationName: item.locationName || '',
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          to={`/items/${id}`}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-white border border-cream-200 shadow-card text-cream-500 hover:text-charcoal-800 hover:border-cream-400 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal-800 tracking-tight">Edit Item</h1>
          <p className="text-sm text-cream-400 font-medium mt-0.5 truncate max-w-xs">{item.title}</p>
        </div>
      </div>

      {/* Current photo preview */}
      {item.photos?.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card p-4 mb-6"
        >
          <p className="text-xs font-bold text-cream-400 uppercase tracking-wide mb-3">Current Photos</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {item.photos.map((src, i) => (
              <div key={i} className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border border-cream-200">
                <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                {i === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-primary-500/80 text-white text-[8px] font-bold text-center py-0.5">
                    COVER
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-cream-400 mt-2">
            To change photos, delete this item and create a new one.
          </p>
        </motion.div>
      )}

      <ItemForm
        mode="edit"
        initialValues={initialValues}
        onSubmit={updateItem}
        loading={isUpdating}
      />
    </div>
  );
}
