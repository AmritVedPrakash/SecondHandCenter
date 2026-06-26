// ─────────────────────────────────────────────────────────────────────────────
//  BazaarBuddy — User API
//  Routes: GET|PUT /api/users/me  |  PUT /me/avatar  |  PUT /me/location
//          POST /me/college-id    |  GET /users/:userId  |  GET /users/:userId/listings
// ─────────────────────────────────────────────────────────────────────────────

import api from './axios';

// ─────────────────────────────────────────────────────────────────────────────
//  GET ME (own full profile)
//  GET /api/users/me   (requires auth)
//
//  Success 200:
//    {
//      success: true,
//      data: {
//        _id, name, email, phone, avatar, locationName,
//        isStudentVerified, collegeIdUrl, isAdmin,
//        location: { type: "Point", coordinates: [lng, lat] },
//        rating: { average: number, count: number },
//        listingsCount: number,
//        createdAt, updatedAt
//      }
//    }
// ─────────────────────────────────────────────────────────────────────────────
export const getMe = () =>
  api.get('/users/me').then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
//  UPDATE PROFILE
//  PUT /api/users/me   (requires auth)
//
//  Request body (all optional):
//    { name?: string, phone?: string, locationName?: string }
//
//  Success 200:
//    { success: true, message: "Profile updated.", data: User }
//
//  Errors:
//    400 — validation error (e.g. phone format invalid)
// ─────────────────────────────────────────────────────────────────────────────
export const updateMe = (body) =>
  api.put('/users/me', body).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
//  UPDATE AVATAR
//  PUT /api/users/me/avatar   (requires auth, multipart/form-data)
//
//  FormData field:  "avatar"  — single image file (jpg/png/webp)
//  Cloudinary handles storage; backend saves the URL.
//
//  Success 200:
//    { success: true, message: "Avatar updated.", data: { avatar: "cloudinary_url" } }
//
//  Errors:
//    400 — "Please upload an image."
//
//  Usage:
//    const fd = new FormData();
//    fd.append('avatar', fileObject);
//    await updateAvatar(fd);
// ─────────────────────────────────────────────────────────────────────────────
export const updateAvatar = (formData) =>
  api
    .put('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
//  UPDATE LOCATION (GPS coordinates)
//  PUT /api/users/me/location   (requires auth)
//
//  Request body:
//    { lat: number, lng: number, locationName?: string }
//    Note: lat/lng from browser navigator.geolocation
//
//  Success 200:
//    {
//      success: true,
//      message: "Location updated.",
//      data: {
//        location: { type: "Point", coordinates: [lng, lat] },
//        locationName: string
//      }
//    }
//
//  Errors:
//    400 — "lat and lng are required."
// ─────────────────────────────────────────────────────────────────────────────
export const updateLocation = ({ lat, lng, locationName = '' }) =>
  api.put('/users/me/location', { lat, lng, locationName }).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
//  UPLOAD COLLEGE ID (get Student badge)
//  POST /api/users/me/college-id   (requires auth, multipart/form-data)
//
//  FormData field:  "collegeId"  — single image file
//  Sets isStudentVerified = true immediately (no manual review in this version).
//
//  Success 200:
//    {
//      success: true,
//      message: "🎓 Student badge verified!",
//      data: { isStudentVerified: true, collegeIdUrl: "cloudinary_url" }
//    }
//
//  Errors:
//    400 — "Please upload your college ID."
//
//  Usage:
//    const fd = new FormData();
//    fd.append('collegeId', fileObject);
//    await uploadCollegeId(fd);
// ─────────────────────────────────────────────────────────────────────────────
export const uploadCollegeId = (formData) =>
  api
    .post('/users/me/college-id', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
//  GET PUBLIC PROFILE
//  GET /api/users/:userId   (public — no auth needed)
//
//  Success 200:
//    {
//      success: true,
//      data: {
//        _id, name, avatar, locationName, isStudentVerified,
//        rating: { average: number, count: number },
//        listingsCount: number,
//        createdAt
//      }
//    }
//
//  Note: email, phone, location coordinates are NOT returned for privacy.
//
//  Errors:
//    404 — "User not found."
// ─────────────────────────────────────────────────────────────────────────────
export const getUserProfile = (userId) =>
  api.get(`/users/${userId}`).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
//  GET USER'S ACTIVE LISTINGS
//  GET /api/users/:userId/listings   (public)
//
//  Query params (all optional):
//    page?  (default 1)
//    limit? (default 12)
//
//  Success 200:
//    {
//      success: true,
//      data: Item[],   // only status="active" items
//      pagination: { page, limit, total, pages }
//    }
//
//  Item fields returned: _id, title, price, isFree, category, photos[], isSold, status, createdAt, locationName
// ─────────────────────────────────────────────────────────────────────────────
export const getUserListings = (userId, params = {}) =>
  api.get(`/users/${userId}/listings`, { params }).then((r) => r.data);
