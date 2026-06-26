// ─────────────────────────────────────────────────────────────────────────────
//  ItemPopup  |  Leaflet popup content — mini item card
//  Rendered inside a Leaflet Popup when user clicks a map pin
// ─────────────────────────────────────────────────────────────────────────────

import { Link } from 'react-router-dom';
import { CAT_ICONS, formatPrice } from '../items/helpers';

export default function ItemPopup({ item }) {
  if (!item) return null;

  const photo = item.photos?.[0];
  const isSold = item.isSold || item.status === 'sold';

  return (
    <div className="w-52 font-[Instrument_Sans,system-ui,sans-serif]">
      {/* Photo */}
      <div className="relative h-28 bg-cream-100 -mx-3 -mt-3 mb-3 overflow-hidden rounded-t-xl">
        {photo ? (
          <img
            src={photo}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {CAT_ICONS[item.category] || '📦'}
          </div>
        )}
        {item.isFree && !isSold && (
          <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-500 text-white">
            FREE
          </span>
        )}
        {isSold && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xs font-black uppercase tracking-widest">Sold</span>
          </div>
        )}
        {item.distanceKm !== undefined && (
          <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-charcoal-800">
            {item.distanceKm}km
          </span>
        )}
      </div>

      {/* Info */}
      <p className="text-sm font-bold text-charcoal-800 truncate mb-1 leading-tight">
        {item.title}
      </p>

      <div className="flex items-center justify-between mb-3">
        <span className={`text-base font-extrabold ${item.isFree ? 'text-forest-600' : 'text-charcoal-800'}`}>
          {formatPrice(item.price, item.isFree)}
        </span>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cream-200 text-charcoal-800/70">
          {CAT_ICONS[item.category]} {item.category}
        </span>
      </div>

      {/* CTA */}
      <Link
        to={`/items/${item._id}`}
        className="block w-full text-center text-sm font-bold py-2 rounded-xl bg-primary-gradient text-white hover:opacity-90 transition-opacity"
      >
        View Item →
      </Link>
    </div>
  );
}
