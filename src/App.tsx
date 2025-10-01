
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ModeProvider } from "@/contexts/ModeContext";
import { RouteRenderer } from "@/components/RouteRenderer";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useCacheWarming } from "@/hooks/useCacheWarming";

// Cache warming component
const CacheWarmingProvider = ({ children }: { children: React.ReactNode }) => {
  useCacheWarming();
  return <>{children}</>;
};

// Optimized query client with better defaults for speed
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes - faster refresh
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 408, 429
        if (error?.status >= 400 && error?.status < 500 && ![408, 429].includes(error?.status)) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ModeProvider>
          <CacheWarmingProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <RouteRenderer />
              </BrowserRouter>
            </TooltipProvider>
          </CacheWarmingProvider>
        </ModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
