// ─────────────────────────────────────────────────────────────────────────────
//  useLocation  (FIXED v2)
//
//  FIXES:
//    1. maximumAge: 0 — always fetch fresh GPS (was 300000, caused silent cache)
//    2. Hard 12s timeout with clearTimeout cleanup
//    3. Proper error messages with browser instruction
//    4. setLocating(false) guaranteed in all paths via finally pattern
//    5. Returns promise that resolves/rejects properly
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useLocationStore } from '../store/locationStore';
import { useAuthStore }     from '../store/authStore';
import { updateLocation as updateLocationApi } from '../api/user.api';

export function useLocation() {
  const {
    lat, lng, locationName, radius,
    isLocating, locationError, hasLocation,
    setLocation, setRadius, setLocating,
    setLocationError, setLocationName,
    clearLocation, getApiParams,
  } = useLocationStore();

  const { isAuthenticated } = useAuthStore();

  const requestLocation = useCallback((options = {}) => {
    const { silent = false, locationName: overrideName } = options;

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = 'Geolocation is not supported by your browser.';
        setLocationError(msg);
        if (!silent) toast.error(msg);
        reject(new Error(msg));
        return;
      }

      setLocating(true);

      // Hard safety timeout — in case browser never calls either callback
      const hardTimer = setTimeout(() => {
        setLocating(false);
        const msg = 'Location timed out. Please check your browser permissions and try again.';
        setLocationError(msg);
        if (!silent) toast.error(msg, { duration: 6000 });
        reject(new Error(msg));
      }, 12000);

      navigator.geolocation.getCurrentPosition(

        // ── SUCCESS ──────────────────────────────────────────────────────────
        async (position) => {
          clearTimeout(hardTimer);

          const newLat = position.coords.latitude;
          const newLng = position.coords.longitude;
          // Use override name if provided, else keep existing locationName
          const name = overrideName !== undefined ? overrideName : (locationName || '');

          // Save to store — this sets hasLocation: true automatically
          setLocation(newLat, newLng, name);

          // Sync to backend (non-blocking, fire-and-forget)
          if (isAuthenticated) {
            updateLocationApi({ lat: newLat, lng: newLng, locationName: name })
              .catch(() => { /* not critical */ });
          }

          if (!silent) {
            toast.success('Location updated!', { icon: '📍', duration: 2000 });
          }

          resolve({ lat: newLat, lng: newLng });
        },

        // ── ERROR ─────────────────────────────────────────────────────────────
        (err) => {
          clearTimeout(hardTimer);
          setLocating(false);

          let message;
          if (err.code === 1) {
            message = 'Location access denied. In Chrome: click the 🔒 icon in address bar → Site settings → Location → Allow. Then click Enable again.';
          } else if (err.code === 2) {
            message = 'Location unavailable. Please check your device location settings and try again.';
          } else if (err.code === 3) {
            message = 'Location timed out. Please try again.';
          } else {
            message = `Location error: ${err.message}`;
          }

          setLocationError(message);
          if (!silent) toast.error(message, { duration: 7000 });
          reject(new Error(message));
        },

        // ── OPTIONS ───────────────────────────────────────────────────────────
        {
          maximumAge:         0,      // ← CRITICAL: always fresh, never cached
          timeout:            10000,  // 10 seconds
          enableHighAccuracy: false,  // false = faster on desktop/laptop
        }
      );
    });
  }, [isAuthenticated, locationName, setLocation, setLocating, setLocationError]);

  const setRadiusWithFeedback = useCallback((km, showToast = false) => {
    setRadius(km);
    if (showToast) toast(`Showing items within ${km} km`, { icon: '🗺️', duration: 1500 });
  }, [setRadius]);

  return {
    lat, lng, locationName, radius,
    isLocating, locationError, hasLocation,
    requestLocation,
    setRadius: setRadiusWithFeedback,
    setLocationName,
    clearLocation,
    getApiParams,
  };
}