// ─────────────────────────────────────────────────────────────────────────────
//  ItemGrid  |  Responsive grid of ItemCards with skeletons + empty state
// ─────────────────────────────────────────────────────────────────────────────

import ItemCard  from './ItemCard';
import EmptyState from '../ui/EmptyState';
import Button    from '../ui/Button';
import { Link }  from 'react-router-dom';

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-card">
      <div className="skeleton aspect-[4/3] rounded-none" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded-lg" />
        <div className="skeleton h-5 w-1/3 rounded-lg" />
        <div className="skeleton h-3.5 w-1/2 rounded-full" />
        <div className="skeleton h-3 w-2/3 rounded-lg" />
      </div>
    </div>
  );
}

export default function ItemGrid({
  items   = [],
  loading = false,
  emptyTitle       = 'No items found',
  emptyDescription = 'Try adjusting your filters or expanding the search radius.',
  showPostCta      = true,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        icon="🛍️"
        title={emptyTitle}
        description={emptyDescription}
        action={
          showPostCta && (
            <Link to="/items/create">
              <Button variant="primary" size="md">Be the first to post</Button>
            </Link>
          )
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {items.map((item, i) => (
        <ItemCard key={item._id} item={item} index={i} />
      ))}
    </div>
  );
}
