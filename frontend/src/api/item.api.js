// ─────────────────────────────────────────────────────────────────────────────
//  BazaarBuddy — Item API
//  Routes: POST /items  |  GET /items  |  GET /items/my  |  GET /items/:id
//          PUT /items/:id  |  DELETE /items/:id  |  PATCH /items/:id/sold
//          POST /items/:id/photos
// ─────────────────────────────────────────────────────────────────────────────

import api from './axios';

// ─────────────────────────────────────────────────────────────────────────────
//  CREATE ITEM
//  POST /api/items   (requires auth, multipart/form-data)
//
//  FormData fields (required):
//    title        — string, max 100 chars
//    description  — string, max 1000 chars
//    price        — number (0 for free)
//    category     — one of: "Electronics" | "Furniture" | "Books" | "Clothes" | "Farm Tools" | "Other"
//    photos       — up to 4 image files (field name = "photos")
//
//  FormData fields (optional):
//    locationName — string (display name like "Civil Lines, Kanpur")
//    lat          — number (overrides user's saved location)
//    lng          — number (overrides user's saved location)
//
//  Note: If lat/lng not provided, backend uses the owner's saved location from DB.
//        Always send lat/lng from browser GPS for accurate listing location.
//
//  Success 201:
//    {
//      success: true,
//      message: "Item listed successfully!",
//      data: Item  // fully populated with owner: { name, avatar, rating, isStudentVerified }
//    }
//
//  Item shape:
//    {
//      _id, title, description, price, isFree (auto = price===0),
//      category, photos: string[],  // Cloudinary URLs
//      owner: { _id, name, avatar, rating, isStudentVerified },
//      location: { type: "Point", coordinates: [lng, lat] },
//      locationName, status: "active", isSold: false, views: 0,
//      createdAt, updatedAt
//    }
//
//  Usage:
//    const fd = new FormData();
//    fd.append('title', 'Old cycle');
//    fd.append('description', 'Good condition');
//    fd.append('price', '500');
//    fd.append('category', 'Farm Tools');
//    fd.append('locationName', 'Civil Lines');
//    fd.append('lat', '26.4499');
//    fd.append('lng', '80.3319');
//    photos.forEach(f => fd.append('photos', f));
//    await createItem(fd);
// ─────────────────────────────────────────────────────────────────────────────
export const createItem = (formData) =>
  api
    .post('/items', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
//  GET NEARBY ITEMS (Home feed)
//  GET /api/items   (public)
//
//  Query params:
//    lat    — number (required for geo filter)
//    lng    — number (required for geo filter)
//    radius — number in KM (default 5)
//    page   — number (default 1)
//    limit  — number (default 20)
//
//  Success 200:
//    {
//      success: true,
//      data: Item[],   // each item has distanceKm field added
//      count: number   // items returned in this page
//    }
//
//  Important: Uses MongoDB $geoNear — lat/lng are REQUIRED for geo query.
//             If lat/lng missing, MongoDB returns error. Always check
//             locationStore.hasLocation before calling this.
//
//  Item shape returned:
//    { _id, title, price, isFree, category, photos[], status, isSold,
//      locationName, views, createdAt, distanceKm,
//      owner: { _id, name, avatar, rating, isStudentVerified } }
// ─────────────────────────────────────────────────────────────────────────────
export const getNearbyItems = (params) =>
  api.get('/items', { params }).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
//  GET MY LISTINGS
//  GET /api/items/my   (requires auth)
//
//  Query params (optional):
//    page  (default 1)
//    limit (default 20)
//
//  Success 200:
//    {
//      success: true,
//      data: Item[],  // ALL own items except deleted (includes sold)
//      pagination: { page, limit, total, pages }
//    }
//
//  Note: Returns items with status "active" AND "sold" — NOT "deleted".
//        Use item.status to filter client-side into tabs.
// ─────────────────────────────────────────────────────────────────────────────
export const getMyItems = (params = {}) =>
  api.get('/items/my', { params }).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
//  GET ITEM BY ID
//  GET /api/items/:itemId   (public)
//
//  Success 200:
//    {
//      success: true,
//      data: {
//        _id, title, description, price, isFree, category,
//        photos: string[],  // Cloudinary URLs
//        status, isSold, views, locationName,
//        location: { type: "Point", coordinates: [lng, lat] },
//        createdAt, updatedAt,
//        owner: { _id, name, avatar, phone, rating, isStudentVerified, locationName }
//        // Note: phone is included here — hide it in UI unless user is logged in
//      }
//    }
//
//  Side effect: Increments item.views by 1 on every call.
//
//  Errors:
//    404 — "Item not found." (deleted items also return 404)
// ─────────────────────────────────────────────────────────────────────────────
export const getItemById = (itemId) =>
  api.get(`/items/${itemId}`).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
//  UPDATE ITEM
//  PUT /api/items/:itemId   (requires auth, owner only)
//
//  Request body (all optional — only include fields you want to change):
//    { title?, description?, price?, category?, locationName? }
//
//  Success 200:
//    { success: true, message: "Item updated.", data: Item }
//
//  Errors:
//    403 — "Not authorized to edit this item."
//    404 — "Item not found."
// ─────────────────────────────────────────────────────────────────────────────
export const updateItem = (itemId, body) =>
  api.put(`/items/${itemId}`, body).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE ITEM
//  DELETE /api/items/:itemId   (requires auth, owner only)
//
//  Note: Soft delete — sets item.status = "deleted".
//        Item won't appear in feeds or search. Owner's listingsCount decremented.
//
//  Success 200:
//    { success: true, message: "Item deleted." }
//
//  Errors:
//    403 — "Not authorized to delete this item."
//    404 — "Item not found."
// ─────────────────────────────────────────────────────────────────────────────
export const deleteItem = (itemId) =>
  api.delete(`/items/${itemId}`).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
//  MARK ITEM AS SOLD
//  PATCH /api/items/:itemId/sold   (requires auth, owner only)
//
//  No request body needed.
//  Sets item.isSold = true, item.status = "sold"
//
//  Success 200:
//    { success: true, message: "Item marked as sold! 🎉", data: Item }
//
//  Errors:
//    403 — "Not authorized."
//    404 — "Item not found."
// ─────────────────────────────────────────────────────────────────────────────
export const markAsSold = (itemId) =>
  api.patch(`/items/${itemId}/sold`).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
//  ADD MORE PHOTOS TO EXISTING ITEM
//  POST /api/items/:itemId/photos   (requires auth, owner only, multipart)
//
//  FormData field:  "photos"  — up to 4 files total (existing + new <= 4)
//
//  Success 200:
//    { success: true, message: "Photos added.", data: { photos: string[] } }
//
//  Errors:
//    400 — "Max 4 photos allowed. You already have X."
//    403 — "Not authorized."
//    404 — "Item not found."
//
//  Usage:
//    const fd = new FormData();
//    newFiles.forEach(f => fd.append('photos', f));
//    await addPhotos(itemId, fd);
// ─────────────────────────────────────────────────────────────────────────────
export const addPhotos = (itemId, formData) =>
  api
    .post(`/items/${itemId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
