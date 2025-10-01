import * as React from 'react';

interface PerformanceMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
}

export function usePerformanceMonitor() {
  React.useEffect(() => {
    try {
      if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;
      if (!('performance' in window)) return;

      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            console.log('Navigation timing:', {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              pageLoadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
            });
          }
          
          if (entry.entryType === 'paint') {
            console.log(`${entry.name}: ${entry.startTime}ms`);
          }
          
          if (entry.entryType === 'largest-contentful-paint') {
            console.log('LCP:', entry.startTime);
          }
        });
      });
      
      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
      
      return () => observer.disconnect();
    } catch (err) {
      console.warn('PerformanceMonitor disabled:', err);
    }
  }, []);
}

export function PerformanceMonitor({ children }: { children: React.ReactNode }) {
  usePerformanceMonitor();
  return <>{children}</>;
}
