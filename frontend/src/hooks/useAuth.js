// ─────────────────────────────────────────────────────────────────────────────
//  useAuth
//  Wrapper around useAuthStore + useNavigate.
//  Adds navigation logic and toast notifications so pages don't repeat them.
//
//  Usage:
//    const { user, isAuthenticated, loginAndGo, logoutAndGo } = useAuth()
// ─────────────────────────────────────────────────────────────────────────────

import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore }  from '../store/authStore';
import { useChatStore }  from '../store/chatStore';
import { updateLocation as updateLocationApi } from '../api/user.api';
import { useLocationStore } from '../store/locationStore';

export function useAuth() {
  const navigate   = useNavigate();
  const location   = useLocation();

  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    authError,
    login,
    register,
    logout,
    fetchMe,
    updateUser,
    syncProfile,
    syncAvatar,
    clearAuthError,
    incrementListingsCount,
    decrementListingsCount,
  } = useAuthStore();

  const { reset: resetChat } = useChatStore();

  const getAuthErrorMessage = (err, defaultMessage) => {
    const serverMessage = err?.response?.data?.message?.toString() || '';
    if (err?.response?.status === 403 || /ban/i.test(serverMessage)) {
      return 'You have baned';
    }
    return serverMessage || defaultMessage;
  };

  // ── loginAndGo ─────────────────────────────────────────────────────────────
  // Logs user in, shows success toast, navigates to intended page.
  // redirectTo: where to go after login (defaults to the page they came from
  //             using React Router's location.state.from, else '/')
  const loginAndGo = async (email, password, redirectTo) => {
    try {
      const userData = await login(email, password);
      toast.success(`Welcome back, ${userData.name.split(' ')[0]}! 👋`);
      const destination = redirectTo || location.state?.from || '/';
      navigate(destination, { replace: true });
      return userData;
    } catch (err) {
      const msg = getAuthErrorMessage(err, 'Invalid email or password.');
      toast.error(msg);
      throw err;
    }
  };

  // ── registerAndGo ──────────────────────────────────────────────────────────
  // Registers new user, shows success toast, navigates home.
  // payload: { name, email, phone, password }
  const registerAndGo = async (payload, redirectTo = '/') => {
    try {
      const userData = await register(payload);
      toast.success(`Welcome to BazaarBuddy, ${userData.name.split(' ')[0]}! 🎉`);
      navigate(redirectTo, { replace: true });
      return userData;
    } catch (err) {
      const msg = err?.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
      throw err;
    }
  };

  // ── logoutAndGo ────────────────────────────────────────────────────────────
  // Logs out, clears ALL state, shows toast, navigates to home.
  const logoutAndGo = async () => {
    await logout();
    resetChat();                          // clear all chat state
    toast.success('You have been logged out.');
    navigate('/', { replace: true });
  };

  // ── requireAuth ────────────────────────────────────────────────────────────
  // Call this before any protected action (e.g. "Message Seller" click).
  // If not logged in → navigate to /login with return path.
  // Returns true if authenticated, false if redirected.
  //
  // Usage:
  //   const handleMessageSeller = () => {
  //     if (!requireAuth()) return   // will redirect to login
  //     // ... proceed with action
  //   }
  const requireAuth = (returnPath) => {
    if (isAuthenticated) return true;
    navigate('/login', {
      state: { from: returnPath || location.pathname },
    });
    return false;
  };

  // ── updateProfileAndSync ───────────────────────────────────────────────────
  // PUT /api/users/me — updates name, phone, locationName in one call.
  // Updates store. Shows toast. Throws on error.
  const updateProfileAndSync = async ({ name, phone, locationName }) => {
    try {
      const updated = await syncProfile({ name, phone, locationName });
      toast.success('Profile updated!');
      return updated;
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update profile.';
      toast.error(msg);
      throw err;
    }
  };

  // ── uploadAvatarAndSync ────────────────────────────────────────────────────
  // PUT /api/users/me/avatar (multipart).
  // file: File object from <input type="file"> or dropzone.
  // Updates store. Shows toast. Throws on error.
  const uploadAvatarAndSync = async (file) => {
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const result = await syncAvatar(fd);
      toast.success('Avatar updated!');
      return result;
    } catch (err) {
      toast.error('Failed to upload avatar.');
      throw err;
    }
  };

  return {
    // ── State (read-only) ──
    user,
    token,
    isAuthenticated,
    isLoading,
    authError,

    // ── Derived helpers ──
    isOwner: (ownerId) =>
      user && (user._id === ownerId || user._id === ownerId?.toString()),

    // ── Actions with navigation + toasts ──
    loginAndGo,
    registerAndGo,
    logoutAndGo,
    requireAuth,
    updateProfileAndSync,
    uploadAvatarAndSync,

    // ── Raw store actions (if you need them directly) ──
    updateUser,
    clearAuthError,
    fetchMe,
    incrementListingsCount,
    decrementListingsCount,
  };
}
