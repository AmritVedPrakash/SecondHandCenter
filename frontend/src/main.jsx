import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

// ─── React Query client ───────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 2, // 2 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ─── Toast styles ─────────────────────────────────────────────────────────────
const toastOptions = {
  duration: 3500,
  style: {
    fontFamily: '"Instrument Sans", system-ui, sans-serif',
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: '14px',
    padding: '12px 16px',
    boxShadow: '0 8px 24px -4px rgba(0,0,0,0.14), 0 2px 6px -2px rgba(0,0,0,0.08)',
    color: '#1c1917',
    background: '#fdfcf9',
    border: '1px solid #ecdece',
    maxWidth: '360px',
  },
  success: {
    iconTheme: { primary: '#457a48', secondary: '#f2f7f2' },
    style: {
      borderLeft: '4px solid #457a48',
    },
  },
  error: {
    iconTheme: { primary: '#dc2626', secondary: '#fef2f2' },
    style: {
      borderLeft: '4px solid #dc2626',
    },
  },
  loading: {
    iconTheme: { primary: '#e08c2a', secondary: '#fdf8f0' },
  },
};

// ─── Root ─────────────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          containerStyle={{ top: 70 }}
          toastOptions={toastOptions}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
