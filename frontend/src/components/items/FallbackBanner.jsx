export default function FallbackBanner({ meta }) {
  if (!meta?.fallback) return null;

  if (meta.fallback === 'wider_radius') {
    return (
      <div className="flex items-center gap-2.5 bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 mb-4">
        <span className="text-lg">📍</span>
        <p className="text-sm text-charcoal-700 font-medium">
          No items were found within your selected radius — showing results up to{' '}
          <span className="font-bold text-primary-600">{meta.usedRadius} km</span> away instead.
        </p>
      </div>
    );
  }

  if (meta.fallback === 'all_items') {
    return (
      <div className="flex items-center gap-2.5 bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 mb-4">
        <span className="text-lg">🌍</span>
        <p className="text-sm text-charcoal-700 font-medium">
          No listings were found near you yet — showing all active items on the platform by default.
        </p>
      </div>
    );
  }

  return null;
}