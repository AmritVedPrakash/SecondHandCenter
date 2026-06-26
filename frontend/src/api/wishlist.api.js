import api from './axios';

// POST   /api/wishlist/:itemId  → toggle save/unsave, returns { saved: bool }
export const toggleWishlist = (itemId) =>
  api.post(`/wishlist/${itemId}`);

// GET    /api/wishlist          → get all saved items (paginated)
export const getWishlist = (params) =>
  api.get('/wishlist', { params });
// params: { page, limit }

// GET    /api/wishlist/check/:itemId → { saved: true | false }
export const checkWishlist = (itemId) =>
  api.get(`/wishlist/check/${itemId}`);

// DELETE /api/wishlist/:itemId  → explicitly unsave
export const removeWishlist = (itemId) =>
  api.delete(`/wishlist/${itemId}`);
