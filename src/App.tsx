import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ModeProvider } from "@/contexts/ModeContext";
import { RouteRenderer } from "@/components/RouteRenderer";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useCacheWarming } from "@/hooks/useCacheWarming";
import { usePerformanceReport } from "@/hooks/usePerformanceReport";
import { mark, measure, now } from "@/utils/performance";
import { useEffect } from "react";

// Cache warming component (must be inside providers)
const CacheWarmingProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    mark('cache-warming-provider-mounted');
  }, []);

  useCacheWarming();
  return <>{children}</>;
};

// Performance tracking wrapper for providers
const PerformanceTracker = ({ name, children }: { name: string; children: React.ReactNode }) => {
  useEffect(() => {
    mark(`${name}-mounted`);
    console.log(`[PERF] 📦 ${name} mounted: ${now().toFixed(2)}ms`);
  }, [name]);

  return <>{children}</>;
};

const App = () => {
  // Generate performance report once app is interactive
  usePerformanceReport();

  useEffect(() => {
    mark('app-component-mounted');
    measure('App Component Mount', 'react-render-initiated', 'app-component-mounted');
  }, []);

  return (
    <PerformanceTracker name="ErrorBoundary">
      <ErrorBoundary>
        <PerformanceTracker name="AuthProvider">
          <AuthProvider>
            <PerformanceTracker name="ModeProvider">
              <ModeProvider>
                <PerformanceTracker name="CacheWarmingProvider">
                  <CacheWarmingProvider>
                    <PerformanceTracker name="TooltipProvider">
                      <TooltipProvider>
                        <Toaster />
                        <Sonner />
                        <PerformanceTracker name="BrowserRouter">
                          <BrowserRouter>
                            <RouteRenderer />
                          </BrowserRouter>
                        </PerformanceTracker>
                      </TooltipProvider>
                    </PerformanceTracker>
                  </CacheWarmingProvider>
                </PerformanceTracker>
              </ModeProvider>
            </PerformanceTracker>
          </AuthProvider>
        </PerformanceTracker>
      </ErrorBoundary>
    </PerformanceTracker>
  );
};

export default App;
