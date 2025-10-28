// Logger utility with production logging enabled
// All logging methods are now available in production for performance monitoring and debugging

export const logger = {
  // Production logging enabled for performance monitoring
  log: (...args: any[]) => {
    console.log(...args);
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

  // Production logging enabled for performance monitoring
  info: (...args: any[]) => {
    console.info(...args);
  },

  // Production logging enabled for performance monitoring
  debug: (...args: any[]) => {
    console.debug(...args);
  }
};