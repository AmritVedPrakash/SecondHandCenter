// ─────────────────────────────────────────────────────────────────────────────
//  RatingModal  |  Star picker + comment → POST /api/ratings
//  Props: open, onClose, sellerId, itemId, sellerName
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal    from '../ui/Modal';
import Button   from '../ui/Button';
import { Textarea } from '../ui/Input';
import RatingStars  from './RatingStars';
import UserAvatar   from './UserAvatar';
import { createRating } from '../../api/rating.api';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
const LABEL_COLORS = ['', 'text-red-500', 'text-amber-500', 'text-yellow-500', 'text-forest-500', 'text-forest-600'];

export default function RatingModal({ open, onClose, sellerId, sellerName, sellerAvatar, itemId }) {
  const [stars,   setStars]   = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!stars) return toast.error('Please select a star rating.');
    setLoading(true);
    try {
      await createRating({ rateeId: sellerId, itemId, stars, comment: comment.trim() });
      toast.success('Rating submitted! Thank you 🙏');
      setStars(5);
      setComment('');
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to submit rating.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Rate Seller"
      subtitle={`How was your experience with ${sellerName}?`}
      maxWidth="max-w-md"
    >
      <div className="space-y-6">
        {/* Seller identity */}
        <div className="flex items-center gap-3 p-3 bg-cream-100 rounded-2xl">
          <UserAvatar user={{ avatar: sellerAvatar, name: sellerName }} size="md" showBadge={false} />
          <p className="font-semibold text-charcoal-800">{sellerName}</p>
        </div>

        {/* Star picker */}
        <div className="text-center space-y-3">
          <p className="text-sm font-semibold text-charcoal-800">Tap to rate</p>
          <div className="flex justify-center">
            <RatingStars
              value={stars}
              interactive
              onChange={setStars}
              size="xl"
            />
          </div>
          {stars > 0 && (
            <p className={`text-sm font-bold ${LABEL_COLORS[stars]}`}>
              {LABELS[stars]}
            </p>
          )}
        </div>

        {/* Comment */}
        <Textarea
          label="Comment (optional)"
          placeholder={`Share your experience with ${sellerName}…`}
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={3}
          maxLength={500}
          showCount
        />

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" size="md" fullWidth onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="md" fullWidth loading={loading} onClick={handleSubmit}>
            Submit Rating
          </Button>
        </div>
      </div>
    </Modal>
  );
}
