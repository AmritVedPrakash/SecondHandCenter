// ─── Shared constants & helpers for item components ───────────────────────────

export const CATEGORIES = ['Electronics','Furniture','Books','Clothes','Farm Tools','Other'];
export const ALL_CATEGORIES = ['All', ...CATEGORIES];
export const CONDITIONS = ['New','Like New','Good','Fair','Poor'];

export const CAT_ICONS = {
  Electronics: '📱', Furniture: '🪑', Books: '📚',
  Clothes: '👗', 'Farm Tools': '🌾', Other: '📦',
};

export const CAT_COLORS = {
  Electronics: 'bg-blue-100 text-blue-700 border-blue-200',
  Furniture:   'bg-amber-100 text-amber-700 border-amber-200',
  Books:       'bg-purple-100 text-purple-700 border-purple-200',
  Clothes:     'bg-pink-100 text-pink-700 border-pink-200',
  'Farm Tools':'bg-forest-100 text-forest-700 border-forest-200',
  Other:       'bg-cream-200 text-charcoal-800 border-cream-300',
};

export function formatPrice(price, isFree) {
  if (isFree || price === 0) return 'FREE';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(price);
}

export function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)      return 'just now';
  if (s < 3600)    return `${Math.floor(s/60)}m ago`;
  if (s < 86400)   return `${Math.floor(s/3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s/86400)}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day:'numeric', month:'short' });
}
