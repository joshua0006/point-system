import { useState, useCallback, useRef } from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { useHoverChunkPrefetch } from '@/hooks/useChunkPrefetch';
import { getImportForPath } from '@/utils/routeImportMap';

/**
 * PrefetchLink - Enhanced Link component with hover-based chunk prefetching
 *
 * Drop-in replacement for react-router-dom's Link that automatically prefetches
 * the target route's JavaScript chunk when user hovers over the link.
 *
 * @example
 * ```tsx
 * // Basic usage (same as Link)
 * <PrefetchLink to="/dashboard">Go to Dashboard</PrefetchLink>
 *
 * // Custom prefetch delay
 * <PrefetchLink to="/settings" prefetchDelay={300}>Settings</PrefetchLink>
 *
 * // Disable prefetching
 * <PrefetchLink to="/admin" enabled={false}>Admin</PrefetchLink>
 * ```
 */

export interface PrefetchLinkProps extends LinkProps {
  /**
   * Delay in milliseconds before triggering prefetch after hover starts
   * @default 200
   *
   * Lower values = more aggressive prefetching (may prefetch on accidental hovers)
   * Higher values = less aggressive (may not complete before click)
   */
  prefetchDelay?: number;

  /**
   * Enable/disable prefetching for this link
   * @default true
   *
   * Set to false to disable prefetching for specific links
   */
  enabled?: boolean;

  /**
   * Callback fired when prefetch completes successfully
   */
  onPrefetchComplete?: () => void;

  /**
   * Callback fired when prefetch fails
   */
  onPrefetchError?: (error: any) => void;
}

export function PrefetchLink({
  to,
  prefetchDelay = 200,
  enabled = true,
  onMouseEnter,
  onPrefetchComplete,
  onPrefetchError,
  ...props
}: PrefetchLinkProps) {
  const { prefetchChunk } = useHoverChunkPrefetch();
  const [isPrefetched, setIsPrefetched] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();

  // Convert 'to' prop to string path for import map lookup
  const path = typeof to === 'string' ? to : to.pathname || '';

  const handleMouseEnter = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      // Call original onMouseEnter if provided
      onMouseEnter?.(event);

      // Skip if prefetching is disabled or already prefetched
      if (!enabled || isPrefetched) {
        return;
      }

      // Get import function for this route
      const importFn = getImportForPath(path);
      if (!importFn) {
        // No import function registered for this path
        return;
      }

      // Clear any existing timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }

      // Start prefetch after delay
      hoverTimeoutRef.current = setTimeout(() => {
        prefetchChunk(importFn)
          .then(() => {
            setIsPrefetched(true);
            onPrefetchComplete?.();
          })
          .catch((error) => {
            // Prefetch failure is non-critical, just log for debugging
            console.debug(`Prefetch failed for ${path}:`, error);
            onPrefetchError?.(error);
          });
      }, prefetchDelay);
    },
    [
      path,
      enabled,
      isPrefetched,
      prefetchDelay,
      prefetchChunk,
      onMouseEnter,
      onPrefetchComplete,
      onPrefetchError,
    ]
  );

  const handleMouseLeave = useCallback(() => {
    // Cancel prefetch if user leaves before delay completes
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  }, []);

  // Cleanup timeout on unmount
  useCallback(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Link
      to={to}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    />
  );
}
