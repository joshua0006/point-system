import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ModeProvider } from "@/contexts/ModeContext";
import { RouteRenderer } from "@/components/RouteRenderer";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useCacheWarming } from "@/hooks/useCacheWarming";

// Cache warming component (must be inside providers)
const CacheWarmingProvider = ({ children }: { children: React.ReactNode }) => {
  useCacheWarming();
  return <>{children}</>;
};

const App = () => (
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

export default App;
