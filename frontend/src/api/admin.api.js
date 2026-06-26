import api from './axios';

// ── Dashboard ──────────────────────────────────────────────────────────────────
export const getAdminStats = () =>
  api.get('/admin/stats');

// ── Users ──────────────────────────────────────────────────────────────────────
export const getAllUsers    = (params)         => api.get('/admin/users', { params });
// params: { search, banned, page, limit, sort }

export const getUserDetail = (userId)         => api.get(`/admin/users/${userId}`);

export const banUser       = (userId, reason) => api.patch(`/admin/users/${userId}/ban`, { reason });

export const unbanUser     = (userId, note)   => api.patch(`/admin/users/${userId}/unban`, { note });

export const verifyStudent = (userId)         => api.patch(`/admin/users/${userId}/verify-student`);

export const makeAdmin     = (userId)         => api.patch(`/admin/users/${userId}/make-admin`);

export const revokeAdmin   = (userId)         => api.patch(`/admin/users/${userId}/revoke-admin`);

// ── Items ──────────────────────────────────────────────────────────────────────
export const getAllAdminItems = (params)          => api.get('/admin/items', { params });
// params: { search, status, moderationStatus, category, page, limit }

export const getAdminItem    = (itemId)           => api.get(`/admin/items/${itemId}`);

export const hideItem        = (itemId, reason)   => api.patch(`/admin/items/${itemId}/hide`, { reason });

export const showItem        = (itemId)           => api.patch(`/admin/items/${itemId}/show`);

export const deleteAdminItem = (itemId, reason)   => api.delete(`/admin/items/${itemId}`, { data: { reason } });

// ── Content Flags ──────────────────────────────────────────────────────────────
const tryFlagsRoute = async (method, path, paramsOrData) => {
  try {
    return await api[method](path, paramsOrData);
  } catch (err) {
    if (err?.response?.status === 404 && path.startsWith('/admin/flags')) {
      const fallbackPath = path.replace('/admin/flags', '/moderation/flags');
      return await api[method](fallbackPath, paramsOrData);
    }
    throw err;
  }
};

export const getAllFlags  = (params)                       => tryFlagsRoute('get', '/admin/flags', { params });
// params: { status, page, limit }

export const getFlagById = (flagId)                        => tryFlagsRoute('get', `/admin/flags/${flagId}`);

export const resolveFlag = (flagId, decision, adminNote)   =>
  tryFlagsRoute('patch', `/admin/flags/${flagId}`, { decision, adminNote });
// decision: 'confirmed_violation' | 'false_positive'

// ── Reports ────────────────────────────────────────────────────────────────────
export const getAllReports      = (params)             => api.get('/reports', { params });
// params: { status, page, limit }

export const updateReportStatus = (reportId, status)  => api.patch(`/reports/${reportId}`, { status });
// status: 'pending' | 'reviewed' | 'resolved'

// ── Audit Logs ─────────────────────────────────────────────────────────────────
export const getAdminLogs = (params) => api.get('/admin/logs', { params });
// params: { action, adminId, page, limit }
