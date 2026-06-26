// ─────────────────────────────────────────────────────────────────────────────
//  ConversationItem  |  Single row in the conversation sidebar
//
//  conv fields: _id, item, buyer, seller, lastMessage, lastMessageAt,
//               buyerUnread, sellerUnread
//  currentUserId — to derive "other" person and unread count
// ─────────────────────────────────────────────────────────────────────────────

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import UserAvatar from '../user/UserAvatar';
import UserAvatarDef from '../user/UserAvatar';

function timeShort(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60)      return 'now';
  if (diff < 3600)    return `${Math.floor(diff/60)}m`;
  if (diff < 86400)   return `${Math.floor(diff/3600)}h`;
  if (diff < 604800)  return `${Math.floor(diff/86400)}d`;
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
}

export default function ConversationItem({ conv, currentUserId, isActive = false }) {
  const isBuyer  = conv.buyer?._id === currentUserId || conv.buyer === currentUserId;
  const other    = isBuyer ? conv.seller : conv.buyer;
  const unread   = isBuyer ? (conv.buyerUnread || 0) : (conv.sellerUnread || 0);
  const isSold   = conv.item?.status === 'sold';

  return (
    <Link
      to={`/chat/${conv._id}`}
      className={`
        flex items-center gap-3 px-4 py-3.5 transition-all duration-150 relative group
        ${isActive
          ? 'bg-primary-50 border-r-[3px] border-primary-500'
          : 'hover:bg-cream-100 border-r-[3px] border-transparent'
        }
      `}
    >
      {/* Avatar + unread ring */}
      <div className="relative flex-shrink-0">
        <UserAvatarDef user={other} size="md" showBadge={false} />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-cream-50 shadow-sm"
          >
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-charcoal-800' : 'font-semibold text-charcoal-800/80'}`}>
            {other?.name || 'Unknown'}
          </p>
          <span className="text-[11px] text-cream-400 flex-shrink-0 font-medium">
            {timeShort(conv.lastMessageAt)}
          </span>
        </div>

        {/* Item title */}
        {conv.item?.title && (
          <p className="text-[11px] text-primary-600 font-semibold truncate mb-0.5 flex items-center gap-1">
            {isSold && <span className="badge-sold !text-[9px] !px-1 !py-0">Sold</span>}
            {conv.item.title}
          </p>
        )}

        {/* Last message */}
        <p className={`text-xs truncate ${unread > 0 ? 'font-semibold text-charcoal-800/70' : 'text-cream-400'}`}>
          {conv.lastMessage || 'No messages yet'}
        </p>
      </div>

      {/* Unread dot (alternative to number for cleaner look) */}
      {unread === 0 && isActive && (
        <div className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
      )}
    </Link>
  );
}
