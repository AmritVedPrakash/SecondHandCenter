

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore }     from '../../store/authStore';
import { useChatStore }     from '../../store/chatStore';
import { useLocationStore } from '../../store/locationStore';
import { useLocation }      from '../../hooks/useLocation';

// ── Avatar helper ─────────────────────────────────────────────────────────────
function getInitials(name = '') {
  return name.trim().split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || '??';
}
function getAvatar(user) {
  return user?.avatar
    ? user.avatar
    : `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(user?.name || 'U')}&backgroundColor=e08c2a&textColor=ffffff&fontSize=40`;
}

// ── Nav link ──────────────────────────────────────────────────────────────────
function NavLink({ to, children }) {
  const { pathname } = useRouterLocation();
  const active = pathname === to || pathname.startsWith(to + '/');
  return (
    <Link
      to={to}
      className={`text-sm font-semibold px-1 py-0.5 transition-colors duration-150 relative group ${
        active ? 'text-primary-600' : 'text-charcoal-800/70 hover:text-charcoal-800'
      }`}
    >
      {children}
      <span className={`absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-primary-500 transition-transform origin-left duration-200 ${active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
    </Link>
  );
}

// ── Main Navbar ───────────────────────────────────────────────────────────────
export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const totalUnread   = useChatStore(s => s.totalUnread);
  const locationName  = useLocationStore(s => s.locationName);
  const hasLocation   = useLocationStore(s => s.hasLocation);
  const { requestLocation, isLocating } = useLocation();

  const navigate = useNavigate();
  const [searchVal, setSearchVal]   = useState('');
  const [dropOpen,  setDropOpen]    = useState(false);
  const dropRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
    else navigate('/search');
  };

  const handleLogout = async () => {
    setDropOpen(false);
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 bg-cream-50/95 backdrop-blur-md border-b border-cream-200 shadow-[0_1px_12px_rgba(0,0,0,0.05)]">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">

        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
          <div className="w-8 h-8 rounded-xl bg-primary-gradient flex items-center justify-center shadow-[0_2px_8px_rgba(224,140,42,0.4)] group-hover:shadow-[0_4px_16px_rgba(224,140,42,0.5)] transition-shadow">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <span className="font-extrabold text-charcoal-800 tracking-tight hidden sm:block">SecondHandCenter</span>
        </Link>

        {/* ── Search ── */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search items near you…"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onFocus={() => { if (!searchVal) navigate('/search'); }}
              className="input pl-10 pr-4 h-9 text-sm bg-white rounded-xl border-cream-300 focus:border-primary-400"
            />
          </div>
        </form>

        {/* ── Right actions ── */}
        <div className="flex items-center gap-1.5 flex-shrink-0">

          {/* Location badge */}
          <button
            onClick={() => requestLocation()}
            disabled={isLocating}
            title={hasLocation ? `Location: ${locationName || 'Set'}` : 'Enable location'}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
              hasLocation
                ? 'bg-forest-50 border-forest-200 text-forest-700 hover:bg-forest-100'
                : 'bg-cream-100 border-cream-300 text-cream-500 hover:bg-cream-200 hover:text-charcoal-800'
            }`}
          >
            {isLocating ? (
              <span className="w-3 h-3 rounded-full border border-forest-400 border-t-transparent animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
            <span className="max-w-[80px] truncate">
              {hasLocation ? (locationName || 'Located') : 'Location'}
            </span>
          </button>

          {isAuthenticated ? (
            <>
              {/* ── Desktop nav links ── */}
              <div className="hidden md:flex items-center gap-4 mx-1">
                <NavLink to="/search">Browse</NavLink>
              </div>

              {/* ── Post item button ── */}
              <Link to="/items/create" className="hidden sm:flex btn btn-primary btn-sm gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Post
              </Link>

              {/* ── Chat icon ── */}
              <Link to="/chat" className="relative p-2 rounded-xl text-charcoal-800/70 hover:text-charcoal-800 hover:bg-cream-200 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <AnimatePresence>
                  {totalUnread > 0 && (
                    <motion.span
                      className="notif-dot"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    >
                      {totalUnread > 9 ? '9+' : totalUnread}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {/* ── Profile dropdown ── */}
              <div ref={dropRef} className="relative">
                <button
                  onClick={() => setDropOpen(v => !v)}
                  className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 ring-primary-300 transition-all"
                >
                  <img
                    src={getAvatar(user)}
                    alt={user?.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-cream-200"
                    onError={e => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=e08c2a&color=fff&size=64`;
                    }}
                  />
                </button>

                <AnimatePresence>
                  {dropOpen && (
                    <motion.div
                      className="absolute right-0 mt-2 w-56 bg-cream-50 rounded-2xl shadow-card-lg border border-cream-200 py-2 z-50"
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0,  scale: 1 }}
                      exit={{ opacity: 0,  y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                    >
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-cream-200">
                        <p className="text-sm font-bold text-charcoal-800 truncate">{user?.name}</p>
                        <p className="text-xs text-cream-500 truncate mt-0.5">{user?.email}</p>
                        {user?.isStudentVerified && (
                          <span className="badge-blue mt-1.5 inline-flex">🎓 Student Verified</span>
                        )}
                      </div>

                      {/* Links */}
                      {[
                        { to: `/profile/${user?._id}`, label: '👤 My Profile' },
                        { to: '/my-listings',          label: '📦 My Listings' },
                        { to: '/items/create',         label: '➕ Post an Item', sm: true },
                        { to: '/chat',                 label: '💬 Messages',   sm: true },
                      ].map(({ to, label, sm }) => (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setDropOpen(false)}
                          className={`flex items-center px-4 py-2.5 text-sm text-charcoal-800 hover:bg-cream-100 transition-colors ${sm ? 'md:hidden' : ''}`}
                        >
                          {label}
                        </Link>
                      ))}

                      <div className="border-t border-cream-200 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          🚪 Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            /* ── Not logged in ── */
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn btn-ghost btn-sm hidden sm:flex">Login</Link>
              <Link to="/login" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
