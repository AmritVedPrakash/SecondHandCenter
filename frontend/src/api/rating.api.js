// ─────────────────────────────────────────────────────────────────────────────
//  BazaarBuddy — Rating API
//  Routes: POST /api/ratings  |  GET /api/ratings/user/:userId
// ─────────────────────────────────────────────────────────────────────────────

import api from './axios';

// ─────────────────────────────────────────────────────────────────────────────
//  CREATE RATING
//  POST /api/ratings   (requires auth)
//
//  Request body:
//    {
//      rateeId:  string,    // userId of the person being rated (seller usually)
//      itemId:   string,    // item this transaction was about
//      stars:    number,    // 1 to 5 (integer)
//      comment?: string     // optional, max 500 chars
//    }
//
//  Side effect:
//    - Recalculates and saves ratee's average rating in User model
//      (rating.average = round to 1 decimal, rating.count = total ratings)
//
//  Success 201:
//    {
//      success: true,
//      message: "Rating submitted!",
//      data: { _id, rater, ratee, item, stars, comment, createdAt }
//    }
//
//  Errors:
//    400 — "rateeId, itemId, and stars are required."
//    400 — "You cannot rate yourself."
//    400 — "You have already rated this transaction."
//         (Unique index: one rating per rater per item)
// ─────────────────────────────────────────────────────────────────────────────
export const createRating = ({ rateeId, itemId, stars, comment = '' }) =>
  api.post('/ratings', { rateeId, itemId, stars, comment }).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
//  GET USER RATINGS (reviews received)
//  GET /api/ratings/user/:userId   (public)
//
//  Success 200:
//    {
//      success: true,
//      data: Rating[],    // sorted newest first
//      count: number
//    }
//
//  Rating shape:
//    {
//      _id, stars, comment, createdAt,
//      rater: { _id, name, avatar },   // person who gave the rating
//      ratee: userId,
//      item:  { _id, title }            // item the transaction was about
//    }
//
//  Usage: Show on profile page as "Reviews" section.
// ─────────────────────────────────────────────────────────────────────────────
export const getUserRatings = (userId) =>
  api.get(`/ratings/user/${userId}`).then((r) => r.data);
