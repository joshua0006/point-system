import { useState, useCallback, useRef } from 'react';
import { NavLink, NavLinkProps } from 'react-router-dom';
import { useHoverChunkPrefetch } from '@/hooks/useChunkPrefetch';
import { getImportForPath } from '@/utils/routeImportMap';

/**
 * PrefetchNavLink - Enhanced NavLink component with hover-based chunk prefetching
 *
 * Drop-in replacement for react-router-dom's NavLink that automatically prefetches
 * the target route's JavaScript chunk when user hovers over the link.
 * Preserves NavLink's active state styling capabilities.
 *
 * @example
 * ```tsx
 * // Basic usage (same as NavLink)
 * <PrefetchNavLink to="/dashboard">Dashboard</PrefetchNavLink>
 *
 * // With active styling
 * <PrefetchNavLink
 *   to="/settings"
 *   className={({ isActive }) => isActive ? 'active' : ''}
 * >
 *   Settings
 * </PrefetchNavLink>
 *
 * // Custom prefetch delay
 * <PrefetchNavLink to="/admin" prefetchDelay={300}>Admin</PrefetchNavLink>
 *
 * // Disable prefetching
 * <PrefetchNavLink to="/profile" enabled={false}>Profile</PrefetchNavLink>
 * ```
 */

export interface PrefetchNavLinkProps extends NavLinkProps {
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

export function PrefetchNavLink({
  to,
  prefetchDelay = 200,
  enabled = true,
  onMouseEnter,
  onPrefetchComplete,
  onPrefetchError,
  ...props
}: PrefetchNavLinkProps) {
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
    <NavLink
      to={to}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    />
  );
}
