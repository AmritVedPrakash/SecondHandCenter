// ─────────────────────────────────────────────────────────────────────────────
//  BazaarBuddy — Search API
//  Route: GET /api/search
// ─────────────────────────────────────────────────────────────────────────────

import api from './axios';

// ─────────────────────────────────────────────────────────────────────────────
//  SEARCH ITEMS
//  GET /api/search   (public)
//
//  Query params:
//    q?          — keyword string (searches title + description, case-insensitive regex)
//    lat?        — number (required for geo filter)
//    lng?        — number (required for geo filter)
//    radius?     — number in KM (default 5)
//    category?   — "Electronics" | "Furniture" | "Books" | "Clothes" | "Farm Tools" | "Other"
//    minPrice?   — number (inclusive, e.g. 0 for free items when maxPrice=0)
//    maxPrice?   — number (inclusive)
//    page?       — number (default 1)
//    limit?      — number (default 20)
//
//  Success 200:
//    {
//      success: true,
//      data: Item[],
//      pagination: {
//        page:  number,
//        limit: number,
//        total: number,   // total matching items (for pagination UI)
//        pages: number    // total pages
//      },
//      filters: {
//        q, category, minPrice, maxPrice, radiusKm   // echoed back from request
//      }
//    }
//
//  Each item has:
//    { _id, title, description, price, isFree, category, photos[],
//      status, locationName, createdAt, distanceKm,
//      owner: { _id, name, avatar, rating, isStudentVerified } }
//
//  Important notes:
//    - Geo filter runs FIRST (MongoDB $geoNear), then keyword filter
//    - If lat/lng are missing, geoNear still runs but from [0,0] — results will be wrong
//    - Always pass lat/lng from locationStore when calling this
//    - Free items filter: set minPrice=0 and maxPrice=0
//
//  Usage examples:
//    searchItems({ q: 'cycle', lat: 26.44, lng: 80.33, radius: 10 })
//    searchItems({ category: 'Books', lat: 26.44, lng: 80.33 })
//    searchItems({ minPrice: 0, maxPrice: 0, lat: 26.44, lng: 80.33 })  // free only
// ─────────────────────────────────────────────────────────────────────────────
export const searchItems = (params = {}) =>
  api.get('/search', { params }).then((r) => r.data);
