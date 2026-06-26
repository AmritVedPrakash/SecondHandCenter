
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useConversations }   from '../hooks/useConversations';
import ConversationList       from '../components/chat/ConversationList';

export default function ChatListPage() {
  const { conversations, isLoading } = useConversations();

  return (
    <div className="max-w-5xl mx-auto px-0 sm:px-4 py-0 sm:py-6">
      <div className="flex gap-0 sm:gap-4 items-start">

        {/* ── Conversation list ── */}
        <div className="w-full md:w-80 lg:w-96 flex-shrink-0 bg-white sm:rounded-2xl sm:border sm:border-cream-200 sm:shadow-card overflow-hidden" style={{ minHeight: 'calc(100vh - 120px)' }}>
          <ConversationList conversations={conversations} loading={isLoading} showHeader />
        </div>

        {/* ── Desktop placeholder ── */}
        <div className="hidden md:flex flex-1 items-center justify-center bg-cream-50 rounded-2xl border border-cream-200 border-dashed" style={{ minHeight: 'calc(100vh - 120px)' }}>
          <motion.div
            initial={{ opacity:0, y:12 }}
            animate={{ opacity:1, y:0 }}
            className="text-center space-y-3"
          >
            <div className="w-20 h-20 rounded-3xl bg-cream-100 flex items-center justify-center text-4xl mx-auto animate-float">
              💬
            </div>
            <h2 className="text-base font-bold text-charcoal-800">Select a conversation</h2>
            <p className="text-sm text-cream-400 max-w-xs">Choose a conversation from the left to start chatting.</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}