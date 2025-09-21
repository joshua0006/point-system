import { useEffect } from 'react';

interface PerformanceMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
}

export function usePerformanceMonitor() {
  useEffect(() => {
    // Monitor Core Web Vitals
    if ('performance' in window) {
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
    }
  }, []);
}

export function PerformanceMonitor({ children }: { children: React.ReactNode }) {
  usePerformanceMonitor();
  return <>{children}</>;
}