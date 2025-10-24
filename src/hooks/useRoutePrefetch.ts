import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RoutePrefetchConfig {
  routes: string[];
  priority?: 'high' | 'low';
  delay?: number;
}

export function useRoutePrefetch({ routes, priority = 'low', delay = 1000 }: RoutePrefetchConfig) {
  useEffect(() => {
    const prefetchTimer = setTimeout(() => {
      routes.forEach(route => {
        // Create link element for prefetching
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        link.as = 'fetch';

        if (priority === 'high') {
          link.setAttribute('importance', 'high');
        }

        document.head.appendChild(link);

        // Cleanup after a while
        setTimeout(() => {
          if (document.head.contains(link)) {
            document.head.removeChild(link);
          }
        }, 30000);
      });
    }, delay);

    return () => clearTimeout(prefetchTimer);
  }, [routes, priority, delay]);
}

/**
 * Intelligent route prefetching based on user role
 * Automatically prefetches likely next routes after idle time
 */
export function useRoleBasedPrefetch() {
  const { profile } = useAuth();
  const prefetchedRoutes = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!profile) return;

    // Determine likely routes based on user role
    const getLikelyRoutes = (): string[] => {
      if (profile.role === 'admin' || profile.role === 'master_admin') {
        return ['/admin-dashboard', '/admin-dashboard/overview', '/admin-dashboard/users'];
      } else if (profile.role === 'consultant') {
        return ['/consultant-dashboard', '/services', '/campaigns'];
      } else {
        return ['/dashboard', '/marketplace', '/campaigns', '/gifting'];
      }
    };

    const prefetchRoute = (path: string) => {
      if (prefetchedRoutes.current.has(path)) return;

      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = path;
      link.as = 'fetch';
      document.head.appendChild(link);
      prefetchedRoutes.current.add(path);

      setTimeout(() => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      }, 30000);
    };

    // PERFORMANCE: Balanced delay for route prefetching
    // Prefetch routes after initial content is visible
    const timer = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          // Only prefetch top 2 most likely routes (reduced scope)
          getLikelyRoutes().slice(0, 2).forEach(prefetchRoute);
        }, { timeout: 2000 });
      } else {
        getLikelyRoutes().slice(0, 2).forEach(prefetchRoute);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [profile]);
}

export function useHoverPrefetch() {
  const navigate = useNavigate();

  const prefetchRoute = (route: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    link.as = 'document';
    document.head.appendChild(link);
    
    setTimeout(() => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    }, 5000);
  };

  return { prefetchRoute };
}