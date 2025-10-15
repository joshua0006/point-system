import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

// React Query client with optimized defaults to prevent tab-switch refetches
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevent aggressive refetching on tab focus (fixes loading animation on tab switch)
      refetchOnWindowFocus: false,
      // Prevent refetching when component remounts (defensive layer)
      refetchOnMount: false,
      // Data stays fresh for 5 minutes before considered stale
      staleTime: 5 * 60 * 1000,
      // Cache retained for 10 minutes (garbage collection time)
      gcTime: 10 * 60 * 1000,
      // Reduce retry attempts for faster failure feedback
      retry: 1,
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
