// ─────────────────────────────────────────────────────────────────────────────
//  BazaarBuddy — Axios Base Instance
//  All API files import from here. Never import axios directly in components.
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios';

// ── Base URL from .env ────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Create instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach JWT token automatically ──────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bb_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 globally ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bb_token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
