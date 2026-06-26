// ─────────────────────────────────────────────────────────────────────────────
//  useProfile
//  React Query wrapper for public profile + listings + ratings.
//  Used in ProfilePage.jsx and MyProfilePage.jsx.
//
//  Fetches all three in parallel:
//    GET /api/users/:userId
//    GET /api/users/:userId/listings
//    GET /api/ratings/user/:userId
//
//  Usage:
//    const { profile, listings, ratings, isLoading } = useProfile(userId)
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query';
import { getUserProfile, getUserListings } from '../api/user.api';
import { getUserRatings } from '../api/rating.api';

export function useProfile(userId) {
  // ── Fetch profile ──────────────────────────────────────────────────────────
  const profileQuery = useQuery({
    queryKey:  ['profile', userId],
    queryFn:   () => getUserProfile(userId),
    enabled:   !!userId,
    staleTime: 1000 * 60 * 3,
  });

  // ── Fetch listings ─────────────────────────────────────────────────────────
  const listingsQuery = useQuery({
    queryKey:  ['profileListings', userId],
    queryFn:   () => getUserListings(userId),
    enabled:   !!userId,
    staleTime: 1000 * 60 * 2,
  });

  // ── Fetch ratings ──────────────────────────────────────────────────────────
  const ratingsQuery = useQuery({
    queryKey:  ['profileRatings', userId],
    queryFn:   () => getUserRatings(userId),
    enabled:   !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const isLoading =
    profileQuery.isLoading ||
    listingsQuery.isLoading ||
    ratingsQuery.isLoading;

  return {
    profile:    profileQuery.data?.data  ?? null,
    listings:   listingsQuery.data?.data ?? [],
    ratings:    ratingsQuery.data?.data  ?? [],
    totalRatings: ratingsQuery.data?.count ?? 0,
    isLoading,
    isError:    profileQuery.isError,
    error:      profileQuery.error,
    refetch: () => {
      profileQuery.refetch();
      listingsQuery.refetch();
      ratingsQuery.refetch();
    },
  };
}
