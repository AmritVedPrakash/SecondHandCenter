// ─────────────────────────────────────────────────────────────────────────────
//  useConversations
//  Loads all conversations for the logged-in user.
//  Used in ChatListPage and the sidebar of ChatDetailPage.
//
//  Updates chatStore.conversations and chatStore.totalUnread.
//
//  Usage:
//    const { conversations, isLoading, refetch } = useConversations()
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react';
import { getMyConversations } from '../api/chat.api';
import { useAuthStore }  from '../store/authStore';
import { useChatStore }  from '../store/chatStore';
import toast from 'react-hot-toast';

export function useConversations() {
  const { user, isAuthenticated } = useAuthStore();
  const {
    conversations,
    setConversations,
    setLoadingConversations,
    isLoadingConversations,
  } = useChatStore();

  const [isError, setIsError] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setLoadingConversations(true);
    setIsError(false);

    try {
      const { data } = await getMyConversations();
      setConversations(data, user._id);
    } catch (err) {
      setIsError(true);
      const msg = err?.response?.data?.message || 'Failed to load conversations.';
      toast.error(msg);
    } finally {
      setLoadingConversations(false);
    }
  }, [isAuthenticated, user?._id]);

  // Load on mount when authenticated
  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated]);

  return {
    conversations,
    isLoading: isLoadingConversations,
    isError,
    refetch:   load,
    isEmpty:   !isLoadingConversations && conversations.length === 0,
  };
}
