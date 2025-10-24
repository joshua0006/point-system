import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ModeProvider } from "@/contexts/ModeContext";
import { RouteRenderer } from "@/components/RouteRenderer";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useEffect, useState, lazy, Suspense } from "react";

// PERFORMANCE: Lazy load performance optimization hooks
// This prevents blocking critical render path on initial load
const useDeferredPerformanceHooks = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Defer until after initial render completes
    const initPerformanceHooks = () => {
      setInitialized(true);
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(initPerformanceHooks, { timeout: 1000 });
    } else {
      setTimeout(initPerformanceHooks, 1000);
    }
  }, []);

  return initialized;
};

// Lazy loaded performance hooks component (code-split from main bundle)
const LazyPerformanceHooks = lazy(() => import('@/components/PerformanceHooks'));

// Performance optimization providers (must be inside auth/mode providers)
const PerformanceProvider = ({ children }: { children: React.ReactNode }) => {
  const shouldInitialize = useDeferredPerformanceHooks();

  return (
    <>
      {shouldInitialize && (
        <Suspense fallback={null}>
          <LazyPerformanceHooks />
        </Suspense>
      )}
      {children}
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <AuthProvider>
      <ModeProvider>
        <PerformanceProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <RouteRenderer />
            </BrowserRouter>
          </TooltipProvider>
        </PerformanceProvider>
      </ModeProvider>
    </AuthProvider>
  </ErrorBoundary>
);

export default App;
