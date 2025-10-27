import { useEffect } from 'react';

/**
 * Hook for prefetching JavaScript chunks (route components)
 *
 * IMPORTANT: This prefetches the actual JS chunks, not HTML documents.
 * It works by triggering dynamic imports which Vite/Webpack will fetch but not execute.
 *
 * @param importFunctions - Array of dynamic import functions for routes
 * @param options - Configuration for prefetching behavior
 *
 * @example
 * ```tsx
 * useChunkPrefetch({
 *   imports: [
 *     () => import('@/pages/Dashboard'),
 *     () => import('@/pages/Marketplace'),
 *   ],
 *   delay: 2000,
 *   priority: 'low'
 * });
 * ```
 */

interface ChunkPrefetchConfig {
  imports: Array<() => Promise<any>>;
  priority?: 'high' | 'low';
  delay?: number;
  enabled?: boolean;
}

export function useChunkPrefetch({
  imports,
  priority = 'low',
  delay = 1000,
  enabled = true
}: ChunkPrefetchConfig) {
  useEffect(() => {
    if (!enabled || imports.length === 0) return;

    const prefetchTimer = setTimeout(() => {
      // Use requestIdleCallback for low priority, or immediate for high priority
      const executePrefetch = () => {
        imports.forEach((importFn) => {
          // Trigger the dynamic import - browser will fetch but not execute
          // The chunk gets added to browser cache for instant loading later
          importFn().catch(() => {
            // Silently fail - prefetch is optional, shouldn't break app
            console.debug('Chunk prefetch failed (non-critical)');
          });
        });
      };

      if (priority === 'low' && 'requestIdleCallback' in window) {
        requestIdleCallback(executePrefetch, { timeout: 5000 });
      } else {
        executePrefetch();
      }
    }, delay);

    return () => clearTimeout(prefetchTimer);
  }, [imports, priority, delay, enabled]);
}

/**
 * Hook for hover-based chunk prefetching
 * Returns a function that triggers prefetch for a specific route chunk
 *
 * @example
 * ```tsx
 * const { prefetchChunk } = useHoverChunkPrefetch();
 *
 * <Link
 *   to="/dashboard"
 *   onMouseEnter={() => prefetchChunk(() => import('@/pages/Dashboard'))}
 * >
 *   Dashboard
 * </Link>
 * ```
 */
export function useHoverChunkPrefetch() {
  const prefetchChunk = (importFn: () => Promise<any>): Promise<void> => {
    // Trigger dynamic import on hover
    // By the time user clicks, chunk is likely already downloaded
    return importFn().catch(() => {
      // Silently fail - hover prefetch is optional optimization
      console.debug('Hover prefetch failed (non-critical)');
    });
  };

  return { prefetchChunk };
}
