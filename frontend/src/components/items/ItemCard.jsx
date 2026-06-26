// ─────────────────────────────────────────────────────────────────────────────
//  ItemCard  |  Used in ItemGrid — responsive grid card
//  item fields: _id, title, price, isFree, photos[], category, status,
//               isSold, locationName, distanceKm, views, createdAt
//               owner: { _id, name, avatar, isStudentVerified, rating }
// ─────────────────────────────────────────────────────────────────────────────

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CAT_ICONS, CAT_COLORS, formatPrice, timeAgo } from './helpers';
import UserAvatar from '../user/UserAvatar';

export default function ItemCard({ item, index = 0 }) {
  const photo  = item.photos?.[0];
  const isSold = item.isSold || item.status === 'sold';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4), ease: [0.16,1,0.3,1] }}
    >
      <Link
        to={`/items/${item._id}`}
        className="group block bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-card hover:shadow-card-lg hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98]"
      >
        {/* ── Photo ── */}
        <div className="relative aspect-[4/3] bg-cream-100 overflow-hidden">
          {photo ? (
            <img
              src={photo}
              alt={item.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
              onError={e => { e.target.style.display='none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              {CAT_ICONS[item.category] || '📦'}
            </div>
          )}

          {/* FREE badge */}
          {item.isFree && !isSold && (
            <span className="absolute top-2 left-2 badge-free shadow-md text-xs">FREE</span>
          )}

          {/* SOLD overlay */}
          {isSold && (
            <div className="absolute inset-0 bg-charcoal-900/55 flex items-center justify-center">
              <span className="bg-white text-charcoal-800 text-xs font-black px-4 py-1.5 rounded-full tracking-widest uppercase shadow-lg">
                Sold
              </span>
            </div>
          )}

          {/* Distance badge */}
          {item.distanceKm !== undefined && item.distanceKm !== null && (
            <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-charcoal-800 text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
              {item.distanceKm < 1 ? `${Math.round(item.distanceKm * 1000)}m` : `${item.distanceKm}km`}
            </span>
          )}

          {/* Views */}
          {item.views > 0 && (
            <span className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-black/40 text-white text-[10px] px-1.5 py-0.5 rounded-full backdrop-blur-sm">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              {item.views}
            </span>
          )}
        </div>

        {/* ── Info ── */}
        <div className="p-3">
          <p className="text-sm font-semibold text-charcoal-800 line-clamp-1 mb-1 group-hover:text-primary-600 transition-colors">
            {item.title}
          </p>

          <div className="flex items-center justify-between mb-2">
            <span className={`text-base font-extrabold ${item.isFree ? 'text-forest-600' : 'text-charcoal-800'}`}>
              {formatPrice(item.price, item.isFree)}
            </span>
            <span className="text-[11px] text-cream-400 font-medium">{timeAgo(item.createdAt)}</span>
          </div>

          {/* Category chip */}
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${CAT_COLORS[item.category] || 'bg-cream-200 text-charcoal-800 border-cream-300'}`}>
            {CAT_ICONS[item.category]} {item.category}
          </span>

          {/* Location + seller row */}
          <div className="flex items-center justify-between mt-2">
            {item.locationName ? (
              <p className="text-[11px] text-cream-400 truncate flex items-center gap-0.5 max-w-[calc(100%-32px)]">
                <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {item.locationName}
              </p>
            ) : <span />}
            {item.owner && (
              <UserAvatar user={item.owner} size="xs" showBadge={false} className="flex-shrink-0" />
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
