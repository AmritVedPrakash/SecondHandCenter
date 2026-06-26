// ─────────────────────────────────────────────────────────────────────────────
//  useNearbyItems
//  React Query wrapper for GET /api/items (home feed).
//  Reads lat, lng, radius automatically from locationStore.
//
//  Only fetches when location is available (hasLocation = true).
//  Automatically refetches when radius or location changes.
//
//  Usage (Home.jsx):
//    const {
//      items, isLoading, isError, refetch, total
//    } = useNearbyItems({ category: 'Books' })
//
//  Extra params supported:
//    category? — filter by category
//    page?     — pagination (default 1)
//    limit?    — items per page (default 20)
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query';
import { getNearbyItems } from '../api/item.api';
import { useLocationStore } from '../store/locationStore';

export function useNearbyItems(extraParams = {}) {
  const { lat, lng, radius } = useLocationStore();

  const query = useQuery({
    // ── Query key ──────────────────────────────────────────────────────────
    // Changes in lat/lng/radius/extraParams automatically trigger a refetch.
    queryKey: ['nearbyItems', lat, lng, radius, extraParams],

    // ── Fetch function ─────────────────────────────────────────────────────
    queryFn: () =>
      getNearbyItems({
        lat: lat ?? 0,
        lng: lng ?? 0,
        radius,
        ...extraParams,
      }),

    // ── Always run so the backend can fall back to all active items ───────
    enabled: true,

    // ── Cache for 2 minutes ────────────────────────────────────────────────
    staleTime:          1000 * 60 * 2,

    // ── Keep showing old data while refetching ─────────────────────────────
    placeholderData:    (prev) => prev,

    // ── Don't refetch just because user switched tabs ──────────────────────
    refetchOnWindowFocus: false,
  });

  return {
    items:     query.data?.data   ?? [],
    total:     query.data?.count  ?? 0,
    meta:      query.data?.meta  ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError:   query.isError,
    error:     query.error,
    refetch:   query.refetch,
    // True on very first load (no data at all yet)
    isEmpty:   !query.isLoading && (query.data?.data?.length ?? 0) === 0,
  };
}
