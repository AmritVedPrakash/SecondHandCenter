import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { useAuthStore } from './store/authStore';

// ─── Layout ───────────────────────────────────────────────────────────────────
import Navbar    from './components/layout/Navbar';
import Footer    from './components/layout/footer';
import BottomNav from './components/layout/BottomNav';
import AuthGuard from './components/auth/AuthGuard';

// ─── Admin (NOT lazy — needed immediately on /admin) ─────────────────────────
import AdminGuard  from './components/admin/AdminGuard';
import AdminLayout from './components/admin/AdminLayout';

// ─── Pages (lazy loaded for performance) ─────────────────────────────────────
const Home           = lazy(() => import('./pages/Home'));
const SearchPage     = lazy(() => import('./pages/SearchPage'));
const ItemDetailPage = lazy(() => import('./pages/ItemDetailPage'));
const CreateItemPage = lazy(() => import('./pages/CreateItemPage'));
const EditItemPage   = lazy(() => import('./pages/EditItemPage'));
const MyListingsPage = lazy(() => import('./pages/MyListingsPage'));
const ChatListPage   = lazy(() => import('./pages/ChatListPage'));
const ChatDetailPage = lazy(() => import('./pages/ChatDetailPage'));
const ProfilePage    = lazy(() => import('./pages/ProfilePage'));
const MyProfilePage  = lazy(() => import('./pages/MyProfilePage'));
const LoginPage      = lazy(() => import('./pages/LoginPage'));
const NotFoundPage   = lazy(() => import('./pages/NotFoundPage'));

// ─── Admin pages (lazy) ───────────────────────────────────────────────────────
const DashboardPage       = lazy(() => import('./pages/admin/DashboardPage'));
const UsersPage           = lazy(() => import('./pages/admin/UsersPage'));
const UserDetailPage      = lazy(() => import('./pages/admin/UserDetailPage'));
const ItemsPage           = lazy(() => import('./pages/admin/ItemsPage'));
const AdminItemDetailPage = lazy(() => import('./pages/admin/AdminItemDetailPage'));
const FlagsPage           = lazy(() => import('./pages/admin/FlagsPage'));
const FlagDetailPage      = lazy(() => import('./pages/admin/FlagDetailPage'));
const ReportsPage         = lazy(() => import('./pages/admin/ReportsPage'));

// ─── Page loading fallback ────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-2xl bg-primary-gradient animate-pulse-ring opacity-60" />
        <div className="relative w-12 h-12 rounded-2xl bg-primary-gradient flex items-center justify-center shadow-[0_4px_16px_rgba(224,140,42,0.45)]">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      </div>
      <p className="text-sm text-cream-500 font-medium animate-pulse">Loading…</p>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { token, fetchMe } = useAuthStore();
  const location           = useLocation();

  // Rehydrate user from token on app start.
  // IMPORTANT: dependency is [token], NOT [] — Zustand's persist middleware
  // loads the token from localStorage ASYNCHRONOUSLY. On first render, token
  // is still null. Once persist finishes hydrating, token changes from
  // null -> actual string, and this effect must re-run to fetch the user.
  useEffect(() => {
    if (token) fetchMe();
  }, [token]);

  // Hide Navbar, Footer, and BottomNav on all /admin/* routes
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">

      {/* ── Navbar — hidden on admin pages ── */}
      {!isAdminRoute && <Navbar />}

      {/* ── Page content ── */}
      <main className={`flex-1 ${!isAdminRoute ? 'pb-16 md:pb-0' : ''}`}>
        <Suspense fallback={<PageLoader />}>
          <Routes>

            {/* ── Public routes ── */}
            <Route path="/"                element={<Home />} />
            <Route path="/search"          element={<SearchPage />} />
            <Route path="/items/:id"       element={<ItemDetailPage />} />
            <Route path="/login"           element={<LoginPage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />

            {/* ── Protected routes ── */}
            <Route path="/items/create"    element={<AuthGuard><CreateItemPage /></AuthGuard>} />
            <Route path="/items/:id/edit"  element={<AuthGuard><EditItemPage /></AuthGuard>} />
            <Route path="/my-listings"     element={<AuthGuard><MyListingsPage /></AuthGuard>} />
            <Route path="/chat"            element={<AuthGuard><ChatListPage /></AuthGuard>} />
            <Route path="/chat/:convId"    element={<AuthGuard><ChatDetailPage /></AuthGuard>} />
            <Route path="/profile/me"      element={<AuthGuard><MyProfilePage /></AuthGuard>} />

            {/* ── Admin routes ─────────────────────────────────────────────────
                AdminGuard  → not logged in: redirect /login
                              logged in but not admin: redirect /
                AdminLayout → renders sidebar + topbar + <Outlet />
                Navbar, Footer, and BottomNav hidden above via isAdminRoute
            ── */}
            <Route
              path="/admin"
              element={
                <AdminGuard>
                  <AdminLayout />
                </AdminGuard>
              }
            >
              <Route index                 element={<DashboardPage />} />
              <Route path="users"          element={<UsersPage />} />
              <Route path="users/:userId"  element={<UserDetailPage />} />
              <Route path="items"          element={<ItemsPage />} />
              <Route path="items/:itemId"  element={<AdminItemDetailPage />} />
              <Route path="flags"          element={<FlagsPage />} />
              <Route path="flags/:flagId"  element={<FlagDetailPage />} />
              <Route path="reports"        element={<ReportsPage />} />
            </Route>

            {/* ── 404 ── */}
            <Route path="*" element={<NotFoundPage />} />

          </Routes>
        </Suspense>
      </main>

      {/* ── Footer — hidden on admin pages ── */}
      {!isAdminRoute && <Footer />}

      {/* ── Bottom nav — hidden on admin pages ── */}
      {!isAdminRoute && <BottomNav />}

    </div>
  );
}