// ─────────────────────────────────────────────────────────────────────────────
//  AuthGuard  |  Wraps protected routes
//  If not authenticated → redirect to /login with return path in state
// ─────────────────────────────────────────────────────────────────────────────

import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { PageSpinner }  from '../ui/Spinner';

export default function AuthGuard({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // Still rehydrating token on app start — show spinner briefly
  if (isLoading) return <PageSpinner label="Checking authentication…" />;

  // Not logged in → redirect to /login, preserve return path
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  return children;
}
