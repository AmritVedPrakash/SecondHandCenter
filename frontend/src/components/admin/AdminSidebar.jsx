import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import useAdminStore from '../../store/adminStore';

const NAV_ITEMS = [
  { to: '/admin',         label: 'Dashboard',      icon: '📊', end: true  },
  { to: '/admin/users',   label: 'Users',          icon: '👥', end: false },
  { to: '/admin/items',   label: 'Items',          icon: '📦', end: false },
  { to: '/admin/flags',   label: 'Content Flags',  icon: '🚩', end: false },
  { to: '/admin/reports', label: 'Reports',        icon: '📋', end: false },
];

export default function AdminSidebar() {
  const navigate   = useNavigate();
  const storeLogout = useAuthStore((s) => s.logout);
  const clearAdmin  = useAdminStore((s) => s.clearAdmin);
  const stats       = useAdminStore((s) => s.stats);

  // Badge counts from cached stats
  const badgeCounts = {
    '/admin/flags':   stats?.flags?.pending   || 0,
    '/admin/reports': stats?.reports?.pending || 0,
  };

  const handleLogout = () => {
    clearAdmin();
    storeLogout();
    navigate('/login');
  };

  return (
    <aside className="w-56 min-h-screen bg-[#0d0d11] border-r border-[#2a2a38]
                      flex flex-col flex-shrink-0">

      {/* Brand */}
      <div className="px-5 py-5 border-b border-[#2a2a38]">
        <p className="text-[10px] font-mono text-[#ff6b35] tracking-[3px] uppercase mb-1">
          SecondHandCenter
        </p>
        <h1 className="text-base font-extrabold text-[#e2e2ee] tracking-tight">
          Admin Panel
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon, end }) => {
          const count = badgeCounts[to] || 0;
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                 transition-all duration-150
                 ${isActive
                   ? 'bg-[#ff6b35]/15 text-[#ff6b35] border border-[#ff6b35]/20'
                   : 'text-[#5a5a78] hover:text-[#c0c0d8] hover:bg-[#18181f] border border-transparent'
                 }`
              }
            >
              <span className="text-base w-5 text-center leading-none">{icon}</span>
              <span className="flex-1">{label}</span>
              {count > 0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full
                                 bg-red-500/20 text-red-400 border border-red-500/25 min-w-[20px] text-center">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-[#2a2a38]" />

      {/* Footer links */}
      <div className="py-3 px-2 space-y-0.5">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                     text-[#5a5a78] hover:text-[#c0c0d8] hover:bg-[#18181f]
                     border border-transparent transition-all"
        >
          <span className="text-base w-5 text-center">🌐</span>
          View Site
        </a>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                     text-red-400/80 hover:text-red-400 hover:bg-red-500/8
                     border border-transparent transition-all"
        >
          <span className="text-base w-5 text-center">🚪</span>
          Logout
        </button>
      </div>

    </aside>
  );
}
