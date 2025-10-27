import { Suspense, useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { routeConfig } from '@/config/routes';
import { mark, now } from '@/utils/performance';

export function RouteRenderer() {
  const location = useLocation();
  const componentLoadedRef = useRef<Set<string>>(new Set());

  // ✅ ALL HOOKS AT THE TOP
  useEffect(() => {
    mark('route-renderer-mounted');
    console.log('[PERF] 🛣️ RouteRenderer mounted:', now().toFixed(2), 'ms');
  }, []);

  useEffect(() => {
    mark(`route-${location.pathname}-matched`);
    console.log('[PERF] 🛣️ Route matched:', location.pathname, 'at', now().toFixed(2), 'ms');

    // Mark component load after a small delay (allows Suspense to resolve)
    // This is a simplified approach without wrapper components
    const timeout = setTimeout(() => {
      if (!componentLoadedRef.current.has(location.pathname)) {
        mark(`route-${location.pathname}-loaded`);
        console.log('[PERF] ✅ Route component loaded:', location.pathname, 'at', now().toFixed(2), 'ms');
        componentLoadedRef.current.add(location.pathname);
      }
    }, 50); // Small delay to allow component to mount

    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <Routes>
      {routeConfig.map((route) => {
        const Component = route.component;
        const Skeleton = route.skeleton;

        // ✅ Simple component rendering without inline wrapper functions
        const routeElement = route.protected ? (
          <ProtectedRoute>
            <Component />
          </ProtectedRoute>
        ) : (
          <Component />
        );

        return (
          <Route
            key={route.path}
            path={route.path}
            element={
              <Suspense fallback={Skeleton ? <Skeleton /> : <div>Loading...</div>}>
                {routeElement}
              </Suspense>
            }
          />
        );
      })}
    </Routes>
  );
}