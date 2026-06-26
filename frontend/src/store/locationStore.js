// ─────────────────────────────────────────────────────────────────────────────
//  BazaarBuddy — Location Store  (FIXED)
//
//  FIXES:
//    1. Removed `get hasLocation()` getter — Zustand state objects don't
//       support JS getters. hasLocation is now a plain computed field that
//       gets updated every time setLocation() is called.
//    2. isLocating cleanup is now guaranteed in all code paths.
//    3. Added hasLocation as a real boolean field in state.
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useLocationStore = create(
  persist(
    (set, get) => ({

      // ── State ────────────────────────────────────────────────────────────
      lat:           null,
      lng:           null,
      locationName:  '',
      radius:        5,
      isLocating:    false,
      locationError: null,

      // ── FIXED: hasLocation is a plain boolean, NOT a getter ───────────────
      // Updated atomically whenever setLocation() or clearLocation() is called.
      // Components can safely read this with: const { hasLocation } = useLocationStore()
      hasLocation: false,

      // ── Actions ──────────────────────────────────────────────────────────

      setLocation: (lat, lng, locationName = '') =>
        set({
          lat,
          lng,
          locationName,
          hasLocation:   true,   // ← set explicitly
          locationError: null,
          isLocating:    false,
        }),

      setRadius: (km) =>
        set({ radius: Math.max(1, Math.min(20, Number(km))) }),

      setLocationName: (name) => set({ locationName: name }),

      setLocating: (bool) => set({ isLocating: bool }),

      setLocationError: (msg) =>
        set({ locationError: msg, isLocating: false }),

      clearLocation: () =>
        set({
          lat:           null,
          lng:           null,
          locationName:  '',
          hasLocation:   false,  // ← set explicitly
          locationError: null,
          isLocating:    false,
        }),

      getApiParams: () => {
        const { lat, lng, radius } = get();
        if (lat === null || lng === null) return {};
        return { lat, lng, radius };
      },
    }),

    {
      name:    'bb-location',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        lat:          state.lat,
        lng:          state.lng,
        locationName: state.locationName,
        radius:       state.radius,
        hasLocation:  state.hasLocation,  // ← persist this too
      }),
      // After rehydration, recompute hasLocation from persisted lat/lng
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hasLocation = state.lat !== null && state.lng !== null;
        }
      },
    }
  )
);

export { useLocationStore };