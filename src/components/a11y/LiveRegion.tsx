import { ReactNode, useEffect, useRef } from 'react';

interface LiveRegionProps {
  children: ReactNode;
  /** Priority of announcements: 'polite' (default) or 'assertive' */
  priority?: 'polite' | 'assertive';
  /** Whether the region should be atomic (announce entire content as one unit) */
  atomic?: boolean;
  /** Custom class name */
  className?: string;
  /** Whether to make the region visually hidden (default: true) */
  visuallyHidden?: boolean;
}

/**
 * LiveRegion Component
 *
 * Creates an ARIA live region for announcing dynamic content changes to screen readers.
 * Use 'polite' for non-urgent updates and 'assertive' for critical notifications.
 *
 * WCAG 2.1 Success Criterion 4.1.3 (Status Messages)
 *
 * @example
 * // Polite announcement (default)
 * <LiveRegion>
 *   {itemsCount} items loaded
 * </LiveRegion>
 *
 * @example
 * // Assertive announcement for errors
 * <LiveRegion priority="assertive">
 *   Error: Unable to save changes
 * </LiveRegion>
 */
export function LiveRegion({
  children,
  priority = 'polite',
  atomic = true,
  className,
  visuallyHidden = true
}: LiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure the announcement is made even if content is similar
    if (regionRef.current && children) {
      // Force re-announcement by briefly clearing and restoring content
      const content = regionRef.current.textContent;
      regionRef.current.textContent = '';
      setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = content;
        }
      }, 100);
    }
  }, [children]);

  const visuallyHiddenClass = visuallyHidden
    ? 'sr-only absolute left-[-10000px] w-[1px] h-[1px] overflow-hidden'
    : '';

  return (
    <div
      ref={regionRef}
      role="status"
      aria-live={priority}
      aria-atomic={atomic}
      className={className || visuallyHiddenClass}
    >
      {children}
    </div>
  );
}

/**
 * AlertRegion Component
 *
 * Specialized live region for important messages that require immediate attention.
 * Uses role="alert" which implies aria-live="assertive" and aria-atomic="true".
 *
 * @example
 * <AlertRegion>
 *   Payment failed. Please check your card details.
 * </AlertRegion>
 */
export function AlertRegion({
  children,
  className,
  visuallyHidden = true
}: Omit<LiveRegionProps, 'priority' | 'atomic'>) {
  const visuallyHiddenClass = visuallyHidden
    ? 'sr-only absolute left-[-10000px] w-[1px] h-[1px] overflow-hidden'
    : '';

  return (
    <div
      role="alert"
      className={className || visuallyHiddenClass}
    >
      {children}
    </div>
  );
}

/**
 * StatusMessage Component
 *
 * Specialized live region for status updates that don't require immediate attention.
 * Uses role="status" which implies aria-live="polite" and aria-atomic="true".
 *
 * @example
 * <StatusMessage>
 *   Autosaved at {new Date().toLocaleTimeString()}
 * </StatusMessage>
 */
export function StatusMessage({
  children,
  className,
  visuallyHidden = true
}: Omit<LiveRegionProps, 'priority' | 'atomic'>) {
  const visuallyHiddenClass = visuallyHidden
    ? 'sr-only absolute left-[-10000px] w-[1px] h-[1px] overflow-hidden'
    : '';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={className || visuallyHiddenClass}
    >
      {children}
    </div>
  );
}
