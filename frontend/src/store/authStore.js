// ─────────────────────────────────────────────────────────────────────────────
//  BazaarBuddy — Auth Store
//  Manages: user object, JWT token, login/logout/register actions
//
//  Persists: token only (not user — always re-fetched from /api/users/me)
//  Token key in localStorage: "bb_token"
//
//  Usage anywhere in the app:
//    import { useAuthStore } from '@/store/authStore'
//    const { user, isAuthenticated, login } = useAuthStore()
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { login as loginApi, register as registerApi, logout as logoutApi } from '../api/auth.api';
import { getMe, updateMe as updateMeApi, updateAvatar as updateAvatarApi } from '../api/user.api';

// ── Store definition ──────────────────────────────────────────────────────────
const useAuthStore = create(
  persist(
    (set, get) => ({

      // ── State ──────────────────────────────────────────────────────────────

      // Full user object from backend. null when logged out.
      // Shape: { _id, name, email, phone, avatar, locationName,
      //          isStudentVerified, isAdmin, rating: { average, count },
      //          listingsCount, location: { type, coordinates }, createdAt }
      user: null,

      // JWT token string. Persisted in localStorage as "bb_token".
      token: null,

      // Derived from token presence (true = logged in)
      isAuthenticated: false,

      // True while fetchMe / login / register is running
      isLoading: false,

      // Error message from last failed auth action
      authError: null,

      // ── Actions ────────────────────────────────────────────────────────────

      // ── fetchMe ────────────────────────────────────────────────────────────
      // Call on app startup if token exists (in App.jsx useEffect).
      // Re-fetches full user profile from GET /api/users/me.
      // If token is invalid/expired → clears auth state.
      fetchMe: async () => {
        set({ isLoading: true, authError: null });
        try {
          const { data } = await getMe();
          set({
            user:            data,
            isAuthenticated: true,
            isLoading:       false,
          });
        } catch {
          // Token is invalid — clean up
          localStorage.removeItem('bb_token');
          set({
            user:            null,
            token:           null,
            isAuthenticated: false,
            isLoading:       false,
          });
        }
      },

      // ── login ──────────────────────────────────────────────────────────────
      // POST /api/auth/login → { token, data: User }
      // Saves token to localStorage + sets user in state.
      // Throws on failure — caller handles toast.
      login: async (email, password) => {
        set({ isLoading: true, authError: null });
        try {
          const { token, data } = await loginApi({ email, password });

          if (data?.isBanned) {
            localStorage.removeItem('bb_token');
            set({
              user:            null,
              token:           null,
              isAuthenticated: false,
              isLoading:       false,
            });
            const error = new Error('Your account has been banned.');
            error.response = { status: 403, data: { message: 'Your account has been banned.' } };
            throw error;
          }

          localStorage.setItem('bb_token', token);
          set({
            user:            data,
            token,
            isAuthenticated: true,
            isLoading:       false,
          });
          return data;
        } catch (err) {
          const msg = err?.response?.data?.message || 'Login failed. Please try again.';
          set({ isLoading: false, authError: msg });
          throw err;
        }
      },

      // ── register ───────────────────────────────────────────────────────────
      // POST /api/auth/register → { token, data: User }
      // payload: { name, email, phone, password }
      // Throws on failure — caller handles toast.
      register: async (payload) => {
        set({ isLoading: true, authError: null });
        try {
          const { token, data } = await registerApi(payload);
          localStorage.setItem('bb_token', token);
          set({
            user:            data,
            token,
            isAuthenticated: true,
            isLoading:       false,
          });
          return data;
        } catch (err) {
          const msg = err?.response?.data?.message || 'Registration failed. Please try again.';
          set({ isLoading: false, authError: msg });
          throw err;
        }
      },

      // ── logout ─────────────────────────────────────────────────────────────
      // Calls POST /api/auth/logout (fire-and-forget, backend is stateless).
      // Always clears local state regardless of backend response.
      logout: async () => {
        try { await logoutApi(); } catch { /* ignore */ }
        localStorage.removeItem('bb_token');
        set({
          user:            null,
          token:           null,
          isAuthenticated: false,
          authError:       null,
        });
      },

      // ── updateUser ─────────────────────────────────────────────────────────
      // Shallow merge a partial user object into state.
      // Used after: profile edit, avatar upload, location update, student verify.
      //
      // Example:
      //   updateUser({ avatar: 'new_cloudinary_url' })
      //   updateUser({ isStudentVerified: true, collegeIdUrl: 'url' })
      //   updateUser({ locationName: 'Civil Lines', location: { type:'Point', coordinates:[80.33, 26.44] } })
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      // ── syncProfile ────────────────────────────────────────────────────────
      // PUT /api/users/me — update name, phone, locationName.
      // Updates backend + local state atomically.
      // Returns updated user. Throws on failure.
      syncProfile: async (payload) => {
        const { data } = await updateMeApi(payload);
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
        return data;
      },

      // ── syncAvatar ─────────────────────────────────────────────────────────
      // PUT /api/users/me/avatar — upload new avatar image.
      // formData must have field "avatar" (single image File).
      // Updates local user.avatar on success.
      // Returns { avatar: cloudinaryUrl }. Throws on failure.
      syncAvatar: async (formData) => {
        const { data } = await updateAvatarApi(formData);
        set((state) => ({
          user: state.user ? { ...state.user, avatar: data.avatar } : null,
        }));
        return data;
      },

      // ── clearAuthError ─────────────────────────────────────────────────────
      clearAuthError: () => set({ authError: null }),

      // ── incrementListingsCount ─────────────────────────────────────────────
      // Call after successfully creating an item (optimistic update).
      incrementListingsCount: () =>
        set((state) => ({
          user: state.user
            ? { ...state.user, listingsCount: (state.user.listingsCount || 0) + 1 }
            : null,
        })),

      // ── decrementListingsCount ─────────────────────────────────────────────
      // Call after successfully deleting an item (optimistic update).
      decrementListingsCount: () =>
        set((state) => ({
          user: state.user
            ? { ...state.user, listingsCount: Math.max(0, (state.user.listingsCount || 1) - 1) }
            : null,
        })),
    }),

    // ── Persist config ──────────────────────────────────────────────────────
    {
      name:    'bb-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist the token — user is always re-fetched fresh from API
      partialize: (state) => ({ token: state.token }),
      // After rehydration, set isAuthenticated = true if token exists
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          state.isAuthenticated = true;
        }
      },
    }
  )
);

export { useAuthStore };
