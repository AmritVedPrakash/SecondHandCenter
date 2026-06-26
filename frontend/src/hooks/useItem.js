// ─────────────────────────────────────────────────────────────────────────────
//  useItem
//  React Query wrapper for GET /api/items/:itemId.
//  Used in ItemDetailPage.
//
//  Also provides mutation helpers (delete, markSold) with toasts.
//
//  Usage:
//    const { item, isLoading, isError, deleteMutation, markSoldMutation } = useItem(itemId)
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getItemById, deleteItem, markAsSold, updateItem } from '../api/item.api';
import { useAuthStore }  from '../store/authStore';

export function useItem(itemId) {
  const queryClient = useQueryClient();
  const navigate    = useNavigate();
  const { decrementListingsCount } = useAuthStore();

  // ── Fetch item ─────────────────────────────────────────────────────────────
  const query = useQuery({
    queryKey:  ['item', itemId],
    queryFn:   () => getItemById(itemId),
    enabled:   !!itemId,
    staleTime: 1000 * 60,      // cache 1 minute
    retry:     (count, err) => {
      // Don't retry 404s
      if (err?.response?.status === 404) return false;
      return count < 2;
    },
  });

  // ── Delete item ────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: () => deleteItem(itemId),
    onSuccess: () => {
      decrementListingsCount();
      // Invalidate item list caches
      queryClient.invalidateQueries({ queryKey: ['nearbyItems'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
      queryClient.invalidateQueries({ queryKey: ['myItems'] });
      queryClient.removeQueries({ queryKey: ['item', itemId] });
      toast.success('Item deleted.');
      navigate('/', { replace: true });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to delete item.');
    },
  });

  // ── Mark as sold ───────────────────────────────────────────────────────────
  const markSoldMutation = useMutation({
    mutationFn: () => markAsSold(itemId),
    onSuccess: ({ data }) => {
      // Update cached item in place
      queryClient.setQueryData(['item', itemId], (old) =>
        old ? { ...old, data } : old
      );
      // Invalidate feeds
      queryClient.invalidateQueries({ queryKey: ['nearbyItems'] });
      queryClient.invalidateQueries({ queryKey: ['myItems'] });
      toast.success('Item marked as sold! 🎉');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to mark as sold.');
    },
  });

  // ── Update item (for EditItemPage) ─────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (payload) => updateItem(itemId, payload),
    onSuccess: ({ data }) => {
      queryClient.setQueryData(['item', itemId], (old) =>
        old ? { ...old, data } : old
      );
      queryClient.invalidateQueries({ queryKey: ['nearbyItems'] });
      queryClient.invalidateQueries({ queryKey: ['myItems'] });
      toast.success('Item updated!');
      navigate(`/items/${itemId}`, { replace: true });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to update item.');
    },
  });

  return {
    item:        query.data?.data ?? null,
    isLoading:   query.isLoading,
    isFetching:  query.isFetching,
    isError:     query.isError,
    error:       query.error,
    refetch:     query.refetch,

    // Mutations
    deleteItem:    deleteMutation.mutate,
    isDeleting:    deleteMutation.isPending,

    markAsSold:    markSoldMutation.mutate,
    isMarkingSold: markSoldMutation.isPending,

    updateItem:    updateMutation.mutate,
    isUpdating:    updateMutation.isPending,
  };
}
