// Production-optimized logger utility
// Uses conditional compilation - Vite will tree-shake unused branches
// PERFORMANCE: import.meta.env.DEV is replaced at build time (zero runtime cost)

export const logger = {
  // Development-only logs (completely removed in production builds)
  log: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },

  // Keep errors in production for monitoring/debugging
  // PRODUCTION: Critical errors should still be visible for troubleshooting
  error: (...args: any[]) => {
    console.error(...args);
  },

  // Keep warnings in production for issue detection
  // PRODUCTION: Warnings can help identify non-critical issues
  warn: (...args: any[]) => {
    console.warn(...args);
  },

  // Development-only info (removed in production)
  info: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.info(...args);
    }
  },

  // Development-only debug (removed in production)
  debug: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.debug(...args);
    }
  }
};