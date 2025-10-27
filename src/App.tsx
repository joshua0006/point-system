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
import { mark, measure } from "@/utils/performance";
import { useEffect } from "react";

// Cache warming component (must be inside providers)
const CacheWarmingProvider = ({ children }: { children: React.ReactNode }) => {
  useCacheWarming();
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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
};

export default App;
