import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

// React Query client with optimized defaults for performance and data freshness balance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevent aggressive refetching on tab focus (fixes loading animation on tab switch)
      refetchOnWindowFocus: false,

      // Allow smart refetching on mount - only if data is stale
      // This is safer than `false` and prevents showing stale data after navigating back
      refetchOnMount: 'stale',

      // Data stays fresh for 2 minutes before considered stale
      // Reduced from 5 minutes for better data freshness on navigation
      staleTime: 2 * 60 * 1000,

      // Cache retained for 5 minutes (garbage collection time)
      // Reduced from 10 minutes to free memory faster for unused queries
      gcTime: 5 * 60 * 1000,

      // Reduce retry attempts for faster failure feedback
      retry: 1,

      // Enable automatic refetching in background for stale data
      // This keeps data fresh without blocking UI
      refetchOnReconnect: 'stale',
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
