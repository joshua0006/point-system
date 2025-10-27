/**
 * Performance Monitoring Utility
 *
 * Comprehensive performance tracking for initial page load analysis.
 * DEV-ONLY: All functions are no-ops in production builds.
 */

// Performance mark prefix for namespacing
const MARK_PREFIX = 'app:';

// Store all marks for later analysis
const performanceData = {
  marks: [] as Array<{ name: string; timestamp: number }>,
  measures: [] as Array<{ name: string; duration: number; start: number }>,
  resources: [] as PerformanceResourceTiming[],
  webVitals: {} as Record<string, number>,
};

/**
 * Create a performance mark (point in time)
 */
export const mark = (name: string): void => {
  if (!import.meta.env.DEV) return;

  try {
    const fullName = `${MARK_PREFIX}${name}`;
    performance.mark(fullName);

    const timestamp = performance.now();
    performanceData.marks.push({ name, timestamp });

    console.log(`[PERF] 📍 ${name}: ${timestamp.toFixed(2)}ms`);
  } catch (error) {
    console.warn('Performance mark failed:', error);
  }
};

/**
 * Measure duration between two marks
 */
export const measure = (name: string, startMark: string, endMark?: string): number => {
  if (!import.meta.env.DEV) return 0;

  try {
    const fullName = `${MARK_PREFIX}${name}`;
    const fullStartMark = `${MARK_PREFIX}${startMark}`;
    const fullEndMark = endMark ? `${MARK_PREFIX}${endMark}` : undefined;

    const measureResult = performance.measure(fullName, fullStartMark, fullEndMark);
    const duration = measureResult.duration;
    const start = measureResult.startTime;

    performanceData.measures.push({ name, duration, start });

    // Highlight bottlenecks (>100ms)
    const icon = duration > 100 ? '⚠️' : '✅';
    const label = duration > 100 ? 'BOTTLENECK' : '';

    console.log(`[PERF] ${icon} ${name}: ${duration.toFixed(2)}ms ${label}`);

    return duration;
  } catch (error) {
    console.warn('Performance measure failed:', error);
    return 0;
  }
};

/**
 * Start a timer (returns a function to end the timer)
 */
export const startTimer = (name: string): (() => void) => {
  if (!import.meta.env.DEV) return () => {};

  const startMarkName = `${name}-start`;
  mark(startMarkName);

  return () => {
    const endMarkName = `${name}-end`;
    mark(endMarkName);
    measure(name, startMarkName, endMarkName);
  };
};

/**
 * Track a specific operation with automatic timing
 */
export const trackOperation = async <T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> => {
  if (!import.meta.env.DEV) return operation();

  console.log(`[PERF] 🔄 ${name} Start`);
  const endTimer = startTimer(name);

  try {
    const result = await operation();
    endTimer();
    return result;
  } catch (error) {
    endTimer();
    console.error(`[PERF] ❌ ${name} Failed:`, error);
    throw error;
  }
};

/**
 * Analyze resource loading (network requests, scripts, styles, etc.)
 */
export const analyzeResources = (): void => {
  if (!import.meta.env.DEV) return;

  try {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    performanceData.resources = resources;

    console.group('[PERF] 📦 Resource Loading Analysis');

    // Group by type
    const byType: Record<string, PerformanceResourceTiming[]> = {};
    resources.forEach(resource => {
      const type = resource.initiatorType || 'other';
      if (!byType[type]) byType[type] = [];
      byType[type].push(resource);
    });

    // Summary by type
    Object.entries(byType).forEach(([type, items]) => {
      const totalSize = items.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      const totalDuration = items.reduce((sum, r) => sum + r.duration, 0);

      console.log(`  ${type}: ${items.length} files, ${(totalSize / 1024).toFixed(2)}KB, ${totalDuration.toFixed(2)}ms`);
    });

    // Slowest resources
    const slowest = [...resources]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    console.log('\n  ⏱️ Slowest Resources:');
    slowest.forEach((r, i) => {
      const name = r.name.split('/').pop() || r.name;
      console.log(`    ${i + 1}. ${name}: ${r.duration.toFixed(2)}ms (${(r.transferSize / 1024).toFixed(2)}KB)`);
    });

    // Largest resources
    const largest = [...resources]
      .filter(r => r.transferSize > 0)
      .sort((a, b) => b.transferSize - a.transferSize)
      .slice(0, 5);

    console.log('\n  📊 Largest Resources:');
    largest.forEach((r, i) => {
      const name = r.name.split('/').pop() || r.name;
      console.log(`    ${i + 1}. ${name}: ${(r.transferSize / 1024).toFixed(2)}KB (${r.duration.toFixed(2)}ms)`);
    });

    console.groupEnd();
  } catch (error) {
    console.warn('Resource analysis failed:', error);
  }
};

/**
 * Track Web Vitals (FCP, LCP, CLS, FID, TTFB)
 */
export const trackWebVitals = (): void => {
  if (!import.meta.env.DEV) return;

  try {
    // First Contentful Paint
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    if (fcpEntry) {
      performanceData.webVitals.FCP = fcpEntry.startTime;
      console.log(`[PERF] 🎨 First Contentful Paint: ${fcpEntry.startTime.toFixed(2)}ms`);
    }

    // Largest Contentful Paint (via PerformanceObserver)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          performanceData.webVitals.LCP = lastEntry.startTime;
          console.log(`[PERF] 🖼️ Largest Contentful Paint: ${lastEntry.startTime.toFixed(2)}ms`);
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        // LCP not supported
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            performanceData.webVitals.FID = entry.processingStart - entry.startTime;
            console.log(`[PERF] 👆 First Input Delay: ${performanceData.webVitals.FID.toFixed(2)}ms`);
          });
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
      } catch (e) {
        // FID not supported
      }

      // Cumulative Layout Shift
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          performanceData.webVitals.CLS = clsValue;
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        // CLS not supported
      }
    }

    // Navigation Timing
    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navTiming) {
      const ttfb = navTiming.responseStart - navTiming.requestStart;
      performanceData.webVitals.TTFB = ttfb;
      console.log(`[PERF] ⚡ Time to First Byte: ${ttfb.toFixed(2)}ms`);

      const domLoad = navTiming.domContentLoadedEventEnd - navTiming.domContentLoadedEventStart;
      console.log(`[PERF] 📄 DOM Content Loaded: ${domLoad.toFixed(2)}ms`);

      const pageLoad = navTiming.loadEventEnd - navTiming.loadEventStart;
      console.log(`[PERF] 🚀 Page Load Complete: ${pageLoad.toFixed(2)}ms`);
    }
  } catch (error) {
    console.warn('Web Vitals tracking failed:', error);
  }
};

/**
 * Track font loading
 */
export const trackFontLoading = (): void => {
  if (!import.meta.env.DEV) return;

  if ('fonts' in document) {
    document.fonts.ready.then(() => {
      const loadTime = performance.now();
      console.log(`[PERF] 🔤 Fonts Loaded: ${loadTime.toFixed(2)}ms`);

      // Log individual fonts
      const fontFaces = Array.from(document.fonts);
      if (fontFaces.length > 0) {
        console.group('[PERF] Font Details:');
        fontFaces.forEach((font: any) => {
          console.log(`  - ${font.family} ${font.weight} (${font.status})`);
        });
        console.groupEnd();
      }
    });
  }
};

/**
 * Get current timestamp relative to page load
 */
export const now = (): number => {
  return performance.now();
};

/**
 * Get all collected performance data
 */
export const getPerformanceData = () => {
  return { ...performanceData };
};

/**
 * Clear all performance marks and measures
 */
export const clearPerformanceData = (): void => {
  if (!import.meta.env.DEV) return;

  performance.clearMarks();
  performance.clearMeasures();
  performanceData.marks = [];
  performanceData.measures = [];
  performanceData.resources = [];
  performanceData.webVitals = {};
};

/**
 * Initialize performance monitoring
 * Call this early in app lifecycle
 */
export const initPerformanceMonitoring = (): void => {
  if (!import.meta.env.DEV) return;

  console.log('[PERF] 🎯 Performance Monitoring Initialized');

  // Track Web Vitals
  trackWebVitals();

  // Track font loading
  trackFontLoading();

  // Analyze resources when page loads
  if (document.readyState === 'complete') {
    analyzeResources();
  } else {
    window.addEventListener('load', analyzeResources);
  }
};
