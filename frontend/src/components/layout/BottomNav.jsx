// ─────────────────────────────────────────────────────────────────────────────
//  BottomNav  |  Mobile only (md:hidden)
//  5 tabs: Home · Search · Post(+) · Chat · Profile
// ─────────────────────────────────────────────────────────────────────────────

import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';

function TabIcon({ path, active, children, label, badge }) {
  return (
    <Link
      to={path}
      className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors ${
        active ? 'text-primary-600' : 'text-charcoal-800/40 hover:text-charcoal-800/70'
      }`}
    >
      <div className="relative">
        {children}
        <AnimatePresence>
          {badge > 0 && (
            <motion.span
              className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-cream-50"
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500 }}
            >
              {badge > 9 ? '9+' : badge}
            </motion.span>
          )}
        </AnimatePresence>
        {active && (
          <motion.div
            layoutId="bottom-tab-indicator"
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500"
          />
        )}
      </div>
      <span className={`text-[10px] font-semibold leading-none ${active ? 'text-primary-600' : ''}`}>
        {label}
      </span>
    </Link>
  );
}

export default function BottomNav() {
  const { pathname }      = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const totalUnread       = useChatStore(s => s.totalUnread);

  const is = (path) => pathname === path || pathname.startsWith(path + '/');

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-cream-50/95 backdrop-blur-md border-t border-cream-200 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-stretch h-14 max-w-sm mx-auto">

        {/* Home */}
        <TabIcon path="/" active={pathname === '/'} label="Home">
          <svg className="w-5 h-5" fill={pathname === '/' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={pathname === '/' ? 0 : 2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </TabIcon>

        {/* Search */}
        <TabIcon path="/search" active={is('/search')} label="Search">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={is('/search') ? 2.5 : 2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </TabIcon>

        {/* Post — accent center button */}
        <Link
          to="/items/create"
          className="flex-1 flex items-center justify-center"
        >
          <div className="w-11 h-11 rounded-2xl bg-primary-gradient flex items-center justify-center shadow-[0_4px_14px_rgba(224,140,42,0.5)] active:scale-95 transition-transform">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </Link>

        {/* Chat */}
        <TabIcon path="/chat" active={is('/chat')} label="Chat" badge={totalUnread}>
          <svg className="w-5 h-5" fill={is('/chat') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={is('/chat') ? 0 : 2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </TabIcon>

        {/* Profile */}
        <TabIcon
          path={isAuthenticated ? `/profile/${user?._id}` : '/login'}
          active={is(`/profile/${user?._id}`) || is('/login')}
          label={isAuthenticated ? 'Profile' : 'Login'}
        >
          <svg className="w-5 h-5" fill={is(`/profile/${user?._id}`) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </TabIcon>

      </div>
    </nav>
  );
}
