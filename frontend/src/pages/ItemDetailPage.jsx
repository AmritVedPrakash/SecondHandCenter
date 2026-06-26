// ─────────────────────────────────────────────────────────────────────────────
//  ItemDetailPage  |  /items/:id
//  Shows: photo carousel, title, price, description, seller card, actions
//  Owner: Edit, Mark Sold, Delete
//  Other: Message Seller, Rate Seller, Report Item
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useItem }        from '../hooks/useItem';
import { useAuth }        from '../hooks/useAuth';
import { useAuthStore }   from '../store/authStore';
import { getOrCreateConversation } from '../api/chat.api';
import { createReport }            from '../api/report.api';
import ItemCarousel  from '../components/items/ItemCarousel';
import SellerCard    from '../components/user/SellerCard';
import RatingModal   from '../components/user/RatingModal';
import { CAT_ICONS, CAT_COLORS, formatPrice, timeAgo } from '../components/items/helpers';
import Button        from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Modal         from '../components/ui/Modal';
import { PageSpinner } from '../components/ui/Spinner';
import { Textarea }  from '../components/ui/Input';
import toast         from 'react-hot-toast';

// ── Report reasons ────────────────────────────────────────────────────────────
const REPORT_REASONS = ['Spam or misleading', 'Wrong category', 'Inappropriate content', 'Scam or fraud', 'Already sold', 'Other'];

export default function ItemDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { requireAuth } = useAuth();

  const { item, isLoading, isError, deleteItem, isDeleting, markAsSold, isMarkingSold } = useItem(id);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSoldConfirm,   setShowSoldConfirm]   = useState(false);
  const [showRatingModal,   setShowRatingModal]   = useState(false);
  const [showReportModal,   setShowReportModal]   = useState(false);
  const [reportReason,      setReportReason]      = useState('');
  const [customReason,      setCustomReason]      = useState('');
  const [isContacting,      setIsContacting]      = useState(false);
  const [isReporting,       setIsReporting]       = useState(false);

  if (isLoading) return <PageSpinner label="Loading item…" />;
  if (isError || !item) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="text-6xl">😕</div>
        <h1 className="text-xl font-bold text-charcoal-800">Item not found</h1>
        <p className="text-cream-500">This item may have been deleted.</p>
        <Link to="/"><Button variant="primary" size="md">Browse items</Button></Link>
      </div>
    );
  }

  const isOwner = user && (user._id === item.owner?._id || user._id === item.owner?._id?.toString());
  const isSold  = item.isSold || item.status === 'sold';

  const handleMessageSeller = async () => {
    if (!requireAuth(`/items/${id}`)) return;
    setIsContacting(true);
    try {
      const { data: conv } = await getOrCreateConversation(item._id);
      navigate(`/chat/${conv._id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not start chat.');
      setIsContacting(false);
    }
  };

  const handleReport = async () => {
    const reason = reportReason === 'Other' ? customReason.trim() : reportReason;
    if (!reason) return toast.error('Please select a reason.');
    setIsReporting(true);
    try {
      await createReport({ itemId: item._id, reason });
      toast.success('Report submitted. We will review it shortly.');
      setShowReportModal(false);
      setReportReason('');
      setCustomReason('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit report.');
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {/* ── Back ── */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-cream-500 hover:text-charcoal-800 font-semibold mb-6 group transition-colors">
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to listings
        </Link>

        <div className="grid md:grid-cols-[1fr_380px] gap-8 items-start">

          {/* ── Left: Photos ── */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <div className="relative">
              <ItemCarousel photos={item.photos || []} category={item.category} title={item.title} />
              {isSold && (
                <div className="absolute inset-0 rounded-3xl bg-charcoal-900/55 flex items-center justify-center z-10">
                  <span className="bg-white text-charcoal-800 font-black text-xl px-8 py-3 rounded-2xl tracking-widest uppercase shadow-card-lg">
                    Sold
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Right: Details ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="space-y-5"
          >
            {/* Title + price */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h1 className="text-2xl font-extrabold text-charcoal-800 leading-snug tracking-tight">{item.title}</h1>
              </div>
              <p className={`text-3xl font-extrabold tracking-tight ${item.isFree ? 'text-forest-600' : 'text-charcoal-800'}`}>
                {formatPrice(item.price, item.isFree)}
              </p>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${CAT_COLORS[item.category]}`}>
                {CAT_ICONS[item.category]} {item.category}
              </span>
              {item.condition && (
                <span className="badge-gray">{item.condition}</span>
              )}
              {item.views > 0 && (
                <span className="badge-gray">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                  {item.views} views
                </span>
              )}
              <span className="badge-gray">{timeAgo(item.createdAt)}</span>
            </div>

            {/* Location */}
            {item.locationName && (
              <p className="flex items-center gap-1.5 text-sm text-cream-500 font-medium">
                <svg className="w-4 h-4 flex-shrink-0 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {item.locationName}
                {item.distanceKm && <span className="text-xs text-primary-500 font-bold ml-1">• {item.distanceKm} km away</span>}
              </p>
            )}

            {/* Description */}
            <div className="bg-cream-50 rounded-2xl p-4 border border-cream-200">
              <p className="text-xs font-bold text-cream-400 uppercase tracking-wider mb-2">Description</p>
              <p className="text-sm text-charcoal-800 leading-relaxed whitespace-pre-line">{item.description}</p>
            </div>

            {/* Seller card */}
            <SellerCard seller={item.owner} isOwner={isOwner} />

            {/* ── Actions ── */}
            {isOwner ? (
              // Owner actions
              <div className="space-y-2.5">
                <div className="flex gap-2.5">
                  <Link to={`/items/${item._id}/edit`} className="flex-1">
                    <Button variant="secondary" size="md" fullWidth>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </Button>
                  </Link>
                  {!isSold && (
                    <Button variant="forest" size="md" className="flex-1" onClick={() => setShowSoldConfirm(true)} loading={isMarkingSold}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Mark Sold
                    </Button>
                  )}
                </div>
                <Button variant="danger" size="md" fullWidth onClick={() => setShowDeleteConfirm(true)} loading={isDeleting}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Item
                </Button>
              </div>
            ) : (
              // Buyer actions
              <div className="space-y-2.5">
                {!isSold ? (
                  <Button variant="primary" size="lg" fullWidth loading={isContacting} onClick={handleMessageSeller}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Message Seller
                  </Button>
                ) : (
                  <div className="p-4 bg-cream-100 rounded-2xl text-center">
                    <p className="text-sm font-bold text-cream-500">This item has been sold</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {isAuthenticated && !isOwner && (
                    <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowRatingModal(true)}>
                      ⭐ Rate Seller
                    </Button>
                  )}
                  {isAuthenticated && (
                    <Button variant="ghost" size="md" className="flex-1 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => setShowReportModal(true)}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                      Report
                    </Button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Modals ── */}
      <ConfirmDialog
        open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}
        title="Delete this item?" message="This item will be permanently removed from all listings." 
        confirmLabel="Yes, Delete" loading={isDeleting} type="danger"
        onConfirm={() => { setShowDeleteConfirm(false); deleteItem(); }}
      />

      <ConfirmDialog
        open={showSoldConfirm} onClose={() => setShowSoldConfirm(false)}
        title="Mark as sold?" message="This will mark the item as sold and remove it from active listings."
        confirmLabel="Mark Sold" loading={isMarkingSold} type="warning"
        onConfirm={() => { setShowSoldConfirm(false); markAsSold(); }}
      />

      <RatingModal
        open={showRatingModal} onClose={() => setShowRatingModal(false)}
        sellerId={item.owner?._id} sellerName={item.owner?.name}
        sellerAvatar={item.owner?.avatar} itemId={item._id}
      />

      <Modal open={showReportModal} onClose={() => setShowReportModal(false)} title="Report Item" subtitle="Help us keep BazaarBuddy safe.">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {REPORT_REASONS.map(r => (
              <button key={r} onClick={() => setReportReason(r)}
                className={`text-sm font-semibold py-2.5 px-3 rounded-xl border text-left transition-all ${
                  reportReason === r
                    ? 'bg-red-50 border-red-400 text-red-700'
                    : 'bg-white border-cream-200 text-charcoal-800 hover:border-cream-400'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          {reportReason === 'Other' && (
            <Textarea
              label="Describe the issue"
              placeholder="Tell us what's wrong with this listing…"
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              rows={3} maxLength={500} showCount
            />
          )}
          <div className="flex gap-3">
            <Button variant="secondary" size="md" fullWidth onClick={() => setShowReportModal(false)}>Cancel</Button>
            <Button variant="danger" size="md" fullWidth loading={isReporting} onClick={handleReport}>Submit Report</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
