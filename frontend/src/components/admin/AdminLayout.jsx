import { Outlet, useLocation } from 'react-router-dom';
import { useEffect }           from 'react';
import AdminSidebar            from './AdminSidebar';
import { useAuthStore } from '../../store/authStore';
import useAdminStore           from '../../store/adminStore';
import { getAdminStats, getAdminLogs } from '../../api/admin.api';

const PAGE_TITLES = {
  '/admin':         'Dashboard',
  '/admin/users':   'Users',
  '/admin/items':   'Items',
  '/admin/flags':   'Content Flags',
  '/admin/reports': 'Reports',
};

const getTitle = (pathname) => {
  if (PAGE_TITLES[pathname])                return PAGE_TITLES[pathname];
  if (pathname.startsWith('/admin/users/')) return 'User Detail';
  if (pathname.startsWith('/admin/items/')) return 'Item Detail';
  if (pathname.startsWith('/admin/flags/')) return 'Flag Review';
  return 'Admin';
};

export default function AdminLayout() {
  const location   = useLocation();
  const user       = useAuthStore((s) => s.user);
  const adminStore = useAdminStore();

  useEffect(() => {
    if (adminStore.stats) return;

    adminStore.setStatsLoading(true);
    getAdminStats()
      .then((r) => adminStore.setStats(r.data.data))
      .catch((e) => adminStore.setStatsError(e.message || 'Failed to load stats.'))
      .finally(() => adminStore.setStatsLoading(false));

    adminStore.setLogsLoading(true);
    getAdminLogs({ limit: 8 })
      .then((r) => adminStore.setRecentLogs(r.data.data))
      .catch(() => {})
      .finally(() => adminStore.setLogsLoading(false));
  }, []);

  const title = getTitle(location.pathname);

  return (
    <div className="flex min-h-screen bg-[#0f0f13]">

      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <header
          className="flex-shrink-0 border-b border-[#2a2a38] bg-[#0d0d11]
                     px-6 flex items-center justify-between"
          style={{ height: '52px' }}
        >
          <h2 className="font-bold text-sm text-[#e2e2ee] tracking-tight">{title}</h2>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#ff6b35]/20 border border-[#ff6b35]/30
                            flex items-center justify-center text-xs font-black text-[#ff6b35]
                            overflow-hidden flex-shrink-0">
              {user?.avatar
                ? <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                : user?.name?.[0]?.toUpperCase()
              }
            </div>
            <span className="text-sm font-semibold text-[#e2e2ee] hidden sm:block">
              {user?.name}
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full
                             bg-[#ff6b35]/10 text-[#ff6b35] border border-[#ff6b35]/20
                             tracking-widest uppercase">
              Admin
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>

      </div>
    </div>
  );
}