import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/**
 * AdminGuard
 *
 * Wraps all /admin/* routes.
 * - Not logged in  → redirect to /login (with ?redirect=/admin so they come back after login)
 * - Logged in but not admin → redirect to / silently
 * - Admin → render children
 */
export default function AdminGuard({ children }) {
  const location        = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading       = useAuthStore((s) => s.isLoading);
  const user            = useAuthStore((s) => s.user);

  // ── TEMPORARY DEBUG — remove once everything works ──
  console.log('AdminGuard check:', {
    isAuthenticated,
    isLoading,
    user,
    isAdmin: user?.isAdmin,
  });
  // ──────────────────────────────────────────────────────

  // Wait for fetchMe() to finish before deciding anything.
  // Without this, on a fresh page load isAuthenticated may be true
  // (token exists) but user is still null because fetchMe() hasn't
  // resolved yet — causing a false "not admin" redirect.
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f13]">
        <p className="text-[#5a5a78] text-sm">Checking access…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}