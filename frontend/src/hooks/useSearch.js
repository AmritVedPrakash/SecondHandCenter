// ─────────────────────────────────────────────────────────────────────────────
//  useSearch
//  React Query wrapper for GET /api/search.
//  Includes debouncing, location params, and all filter support.
//
//  Used in: SearchPage.jsx
//
//  Usage:
//    const {
//      items, total, pages, isLoading, isFetching, isEmpty
//    } = useSearch({
//      q:        searchText,
//      category: 'Books',
//      minPrice: 0,
//      maxPrice: 500,
//      page:     1,
//    })
//
//  Filters supported (all optional):
//    q?        — keyword (debounced 400ms internally)
//    category? — one of CATEGORIES or 'All' (ignored if 'All')
//    minPrice? — number
//    maxPrice? — number
//    isFree?   — boolean shortcut (sets minPrice=0, maxPrice=0)
//    page?     — default 1
//    limit?    — default 20
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query';
import { searchItems } from '../api/search.api';
import { useLocationStore } from '../store/locationStore';
import { useDebounce } from './useDebounce';

export function useSearch(filters = {}) {
  const { lat, lng, radius, hasLocation } = useLocationStore();

  // Debounce the search query — don't hit API on every keystroke
  const debouncedQ = useDebounce(filters.q || '', 400);

  // ── Build clean params ────────────────────────────────────────────────────
  const params = {
    // Location (from store — always included)
    ...(hasLocation && { lat, lng, radius }),

    // Keyword search
    ...(debouncedQ && { q: debouncedQ }),

    // Category — skip if 'All' or not provided
    ...(filters.category && filters.category !== 'All' && { category: filters.category }),

    // Price range
    ...(filters.isFree && { minPrice: 0, maxPrice: 0 }),
    ...(!filters.isFree && filters.minPrice !== undefined && filters.minPrice !== '' && {
      minPrice: Number(filters.minPrice),
    }),
    ...(!filters.isFree && filters.maxPrice !== undefined && filters.maxPrice !== '' && {
      maxPrice: Number(filters.maxPrice),
    }),

    // Pagination
    page:  filters.page  || 1,
    limit: filters.limit || 20,
  };

  const query = useQuery({
    // ── Query key ─────────────────────────────────────────────────────────
    // React Query re-fetches whenever any of these change.
    queryKey: [
      'search',
      debouncedQ,
      filters.category,
      filters.minPrice,
      filters.maxPrice,
      filters.isFree,
      filters.page,
      lat,
      lng,
      radius,
    ],

    // ── Fetch function ────────────────────────────────────────────────────
    queryFn: () => searchItems(params),

    // ── Always run (search works without location too) ────────────────────
    enabled: true,

    // ── Show stale data while refetching (avoids flash of empty state) ────
    staleTime:       1000 * 30,    // 30 seconds
    placeholderData: (prev) => prev,

    refetchOnWindowFocus: false,
  });

  return {
    items:      query.data?.data            ?? [],
    total:      query.data?.pagination?.total ?? 0,
    pages:      query.data?.pagination?.pages ?? 0,
    page:       query.data?.pagination?.page  ?? 1,
    filters:    query.data?.filters           ?? {},
    isLoading:  query.isLoading,
    isFetching: query.isFetching,
    isError:    query.isError,
    error:      query.error,
    refetch:    query.refetch,
    isEmpty:    !query.isLoading && (query.data?.data?.length ?? 0) === 0,
  };
}
