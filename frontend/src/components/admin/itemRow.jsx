// ItemRow.jsx
// Single row in the ItemsPage table.
//
// Props:
//   item     — object
//   onHide   — fn(item)
//   onShow   — fn(item)
//   onDelete — fn(item)

import { useNavigate } from 'react-router-dom';
import ModerationBadge from './ModerationBadge';

const CATEGORY_EMOJI = {
  Electronics:  '💻',
  Furniture:    '🪑',
  Books:        '📚',
  Clothes:      '👕',
  'Farm Tools': '🌾',
  Other:        '📦',
};

const timeAgo = (dateStr) => {
  const days = Math.floor((Date.now() - new Date(dateStr)) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 30)  return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

export default function ItemRow({ item, onHide, onShow, onDelete }) {
  const navigate = useNavigate();

  return (
    <tr className="border-b border-[#1c1c2a] hover:bg-[#18181f] transition-colors">

      {/* Photo + title + category */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#1c1c2a]
                          border border-[#2a2a38] flex-shrink-0">
            {item.photos?.[0] ? (
              <img
                src={item.photos[0]}
                className="w-full h-full object-cover"
                alt=""
              />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-lg">
                {CATEGORY_EMOJI[item.category] || '📦'}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#e2e2ee] truncate max-w-[180px]">
              {item.title}
            </p>
            <p className="text-xs text-[#5a5a78]">
              {CATEGORY_EMOJI[item.category]} {item.category}
            </p>
          </div>
        </div>
      </td>

      {/* Price */}
      <td className="px-4 py-3">
        <span className="text-sm font-bold font-mono text-[#ff6b35]">
          {item.isFree ? 'FREE' : `₹${item.price?.toLocaleString('en-IN')}`}
        </span>
      </td>

      {/* Owner */}
      <td className="px-4 py-3">
        <p className="text-sm text-[#e2e2ee] truncate max-w-[140px]">
          {item.owner?.name}
        </p>
        <p className="text-xs text-[#5a5a78] truncate max-w-[140px]">
          {item.owner?.email}
        </p>
      </td>

      {/* Moderation status */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <ModerationBadge status={item.moderationStatus} />
          {item.isHidden && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5
                             rounded-full bg-[#1c1c2a] text-[#5a5a78] border border-[#2a2a38]
                             font-semibold w-fit">
              👁️ Hidden
            </span>
          )}
          {item.isSold && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5
                             rounded-full bg-purple-500/10 text-purple-400
                             border border-purple-500/20 font-semibold w-fit">
              🏷️ Sold
            </span>
          )}
        </div>
      </td>

      {/* Posted */}
      <td className="px-4 py-3">
        <span className="text-xs text-[#5a5a78]">{timeAgo(item.createdAt)}</span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">

          {/* View */}
          <button
            onClick={() => navigate(`/admin/items/${item._id}`)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-[#1c1c2a] text-[#a0a0b8]
                       hover:bg-[#2a2a38] hover:text-[#e2e2ee] transition-colors
                       border border-transparent hover:border-[#2a2a38]"
          >
            View →
          </button>

          {/* Hide / Show toggle */}
          {item.isHidden ? (
            <button
              onClick={() => onShow(item)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-green-500/8 text-green-400
                         border border-green-500/15 hover:bg-green-500/15 transition-colors"
            >
              Restore
            </button>
          ) : (
            <button
              onClick={() => onHide(item)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-orange-500/8 text-orange-400
                         border border-orange-500/15 hover:bg-orange-500/15 transition-colors"
            >
              Hide
            </button>
          )}

          {/* Delete */}
          <button
            onClick={() => onDelete(item)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/8 text-red-400
                       border border-red-500/15 hover:bg-red-500/15 transition-colors"
          >
            Delete
          </button>

        </div>
      </td>

    </tr>
  );
}