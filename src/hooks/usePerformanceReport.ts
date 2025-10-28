/**
 * Performance Report Hook
 *
 * Automatically generates a comprehensive performance report after the page
 * becomes interactive. Now enabled in production for live monitoring.
 */

import { useEffect } from 'react';
import { mark, now } from '@/utils/performance';
import { generatePerformanceReport } from '@/utils/performanceReport';

export const usePerformanceReport = () => {
  useEffect(() => {
    // Mark that the app is interactive
    mark('app-interactive');
    console.log('[PERF] ✨ App Interactive:', now().toFixed(2), 'ms');

    // Generate report after a short delay to capture all async operations
    const reportTimeout = setTimeout(() => {
      mark('performance-report-generated');
      generatePerformanceReport();
    }, 2000); // 2 seconds after interactive to capture deferred operations

    return () => {
      clearTimeout(reportTimeout);
    };
  }, []);
};

export default usePerformanceReport;
