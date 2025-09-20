import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { routeConfig } from '@/config/routes';

export function RouteRenderer() {
  return (
    <Routes>
      {routeConfig.map((route) => {
        const Component = route.component;
        const Skeleton = route.skeleton;
        
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