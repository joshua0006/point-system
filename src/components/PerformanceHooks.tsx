import { useCacheWarming } from '@/hooks/useCacheWarming';
import { useRoleBasedPrefetch } from '@/hooks/useRoutePrefetch';

/**
 * Performance optimization hooks component
 * Separated for lazy loading to reduce initial bundle size
 */
export const PerformanceHooks = () => {
  useCacheWarming();
  useRoleBasedPrefetch();

  return null;
};

export default PerformanceHooks;
