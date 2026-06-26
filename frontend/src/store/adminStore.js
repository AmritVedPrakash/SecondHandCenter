import { create } from 'zustand';

const useAdminStore = create((set) => ({
  // Dashboard stats — cached after first fetch
  stats:        null,
  statsLoading: false,
  statsError:   '',

  // Recent audit logs — cached for activity feed
  recentLogs:   [],
  logsLoading:  false,

  // Setters
  setStats:        (stats)      => set({ stats }),
  setStatsLoading: (val)        => set({ statsLoading: val }),
  setStatsError:   (msg)        => set({ statsError: msg }),
  setRecentLogs:   (logs)       => set({ recentLogs: logs }),
  setLogsLoading:  (val)        => set({ logsLoading: val }),

  // Clear everything on logout
  clearAdmin: () =>
    set({ stats: null, statsLoading: false, statsError: '', recentLogs: [], logsLoading: false }),
}));

export default useAdminStore;
