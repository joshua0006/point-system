import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
        link.as = 'document';
        
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