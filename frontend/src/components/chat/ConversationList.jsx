// ─────────────────────────────────────────────────────────────────────────────
//  ConversationList  |  Sidebar list of all conversations
//  Used in: ChatListPage (full) and ChatDetailPage (sidebar on desktop)
// ─────────────────────────────────────────────────────────────────────────────

import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import ConversationItem from './ConversationItem';
import { useAuthStore } from '../../store/authStore';
import EmptyState from '../ui/EmptyState';
import Button from '../ui/Button';

// Skeleton row
function ConvSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 w-2/3 rounded-lg" />
        <div className="skeleton h-3 w-1/2 rounded-lg" />
        <div className="skeleton h-3 w-3/4 rounded-lg" />
      </div>
    </div>
  );
}

export default function ConversationList({
  conversations = [],
  loading       = false,
  selectedId    = null,
  showHeader    = true,
}) {
  const { user } = useAuthStore();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-cream-200 flex-shrink-0 bg-cream-50">
          <h2 className="font-bold text-charcoal-800 text-base">Messages</h2>
          {conversations.length > 0 && (
            <span className="badge-gray text-xs">{conversations.length}</span>
          )}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-cream-100">
        {loading ? (
          <>
            {Array.from({ length: 5 }).map((_, i) => <ConvSkeleton key={i} />)}
          </>
        ) : conversations.length === 0 ? (
          <EmptyState
            icon="💬"
            title="No conversations yet"
            description="Start chatting by messaging a seller on any listing."
            compact
            action={
              <Link to="/">
                <Button variant="secondary" size="sm">Browse items</Button>
              </Link>
            }
          />
        ) : (
          <AnimatePresence initial={false}>
            {conversations.map((conv, i) => (
              <motion.div
                key={conv._id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
              >
                <ConversationItem
                  conv={conv}
                  currentUserId={user?._id}
                  isActive={conv._id === selectedId}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
