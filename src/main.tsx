import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

// React Query client - optimized for initial page load performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevent aggressive refetching on tab focus
      refetchOnWindowFocus: false,

      // Smart refetching - only if data is stale
      refetchOnMount: 'stale',

      // Aggressive stale time for initial load performance (5 minutes)
      // Data considered fresh for longer to reduce initial load queries
      staleTime: 5 * 60 * 1000,

      // Extended cache time for better performance (10 minutes)
      gcTime: 10 * 60 * 1000,

      // Minimal retry for faster initial page load
      retry: 1,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 3000),

      // Background refetching only for stale data
      refetchOnReconnect: 'stale',

      // Network mode: prioritize cache for faster perceived performance
      networkMode: 'online',
    },
    mutations: {
      // Faster mutation retry for better UX
      retry: 1,
      retryDelay: 1000,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
