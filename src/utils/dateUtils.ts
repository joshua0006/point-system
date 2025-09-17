/**
 * Date utilities for consistent handling across the application
 */

/**
 * Gets the first day of next month as an ISO string
 */
export function getNextBillingDateISO(): string {
  const now = new Date();
  const nextFirstOfMonth = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    1,
    0, 0, 0, 0
  ));
  return nextFirstOfMonth.toISOString();
}

/**
 * Formats a date string or Date object for display
 */
export function formatDate(dateInput: string | Date | null): string {
  if (!dateInput) return 'N/A';
  
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Formats a date for billing display (e.g., "October 1st")
 */
export function formatBillingDate(dateInput: string | Date | null): string {
  if (!dateInput) return 'N/A';
  
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Gets the number of days remaining in the current month
 */
export function getDaysRemainingInMonth(): { daysRemaining: number; daysInMonth: number } {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysRemaining = Math.max(1, endOfMonth.getDate() - now.getDate() + 1);
  const daysInMonth = endOfMonth.getDate();
  
  return { daysRemaining, daysInMonth };
}

/**
 * Calculates billing cycle anchor for the 1st of next month
 */
export function getBillingCycleAnchor(): number {
  const now = new Date();
  const nextMonthFirstUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  return Math.floor(nextMonthFirstUtc.getTime() / 1000);
}