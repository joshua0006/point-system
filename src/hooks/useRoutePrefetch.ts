/**
 * Route Prefetching Hook
 *
 * Performance optimization for Lovable deployment
 * Prefetches route chunks on link hover/focus to eliminate navigation delays
 *
 * Usage:
 * const prefetchRoute = useRoutePrefetch();
 * <Link onMouseEnter={() => prefetchRoute('/dashboard')} />
 */

import { useCallback, useRef } from 'react';
import { logger } from '@/utils/logger';

// Map of route paths to their lazy-loaded components
// This matches the route config in src/config/routes.ts
const ROUTE_PREFETCH_MAP: Record<string, () => Promise<any>> = {
  '/': () => import('@/pages/Index'),
  '/dashboard': () => import('@/pages/UserDashboard'),
  '/seller-dashboard': () => import('@/pages/SellerDashboard'),
  '/consultant-dashboard': () => import('@/pages/ConsultantDashboard'),
  '/admin-dashboard': () => import('@/pages/AdminDashboard'),
  '/admin-dashboard/overview': () => import('@/pages/admin/AdminOverview'),
  '/admin-dashboard/users': () => import('@/pages/admin/AdminUsers'),
  '/admin-dashboard/billing': () => import('@/pages/admin/AdminBilling'),
  '/admin-dashboard/services': () => import('@/pages/admin/AdminServices'),
  '/admin-dashboard/campaigns': () => import('@/pages/admin/AdminCampaigns'),
  '/admin-dashboard/campaigns/targets': () => import('@/pages/admin/AdminCampaignTargets'),
  '/admin-dashboard/campaigns/scripts': () => import('@/pages/admin/AdminCampaignScripts'),
  '/admin-dashboard/campaigns/monitor': () => import('@/pages/admin/AdminCampaignMonitor'),
  '/admin-dashboard/reimbursements': () => import('@/pages/admin/AdminReimbursements'),
  '/marketplace': () => import('@/pages/Marketplace'),
  '/services': () => import('@/pages/Services'),
  '/campaigns': () => import('@/pages/Campaigns'),
  '/campaigns/launch': () => import('@/pages/CampaignLaunch'),
  '/campaigns/my-campaigns': () => import('@/pages/MyCampaigns'),
  '/campaigns/facebook-ads': () => import('@/pages/FacebookAdsCampaigns'),
  '/campaigns/cold-calling': () => import('@/pages/ColdCallingCampaigns'),
  '/campaigns/va-support': () => import('@/pages/VASupportCampaigns'),
  '/gifting': () => import('@/pages/Gifting'),
  '/ai-assistant': () => import('@/pages/AIAssistant'),
  '/ad-copy-generator': () => import('@/pages/AdCopyGenerator'),
  '/settings': () => import('@/pages/Settings'),
  '/user-flows': () => import('@/pages/UserFlows'),
  '/thank-you': () => import('@/pages/ThankYou'),
};

// Track prefetched routes to avoid duplicate requests
const prefetchedRoutes = new Set<string>();

export const useRoutePrefetch = () => {
  // Use ref to avoid re-creating the callback on every render
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const prefetchRoute = useCallback((path: string) => {
    // Clear any pending prefetch timeout
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }

    // Debounce prefetch to avoid excessive requests on rapid hover
    prefetchTimeoutRef.current = setTimeout(() => {
      // Extract base path (remove query params and hash)
      const basePath = path.split('?')[0].split('#')[0];

      // Check if already prefetched
      if (prefetchedRoutes.has(basePath)) {
        logger.log('[PREFETCH] Already prefetched:', basePath);
        return;
      }

      // Find matching route in prefetch map
      const prefetchFn = ROUTE_PREFETCH_MAP[basePath];

      if (prefetchFn) {
        logger.log('[PREFETCH] Prefetching route:', basePath);

        // Mark as prefetched immediately to prevent duplicate requests
        prefetchedRoutes.add(basePath);

        // Trigger the lazy import (Webpack/Vite will fetch the chunk)
        prefetchFn()
          .then(() => {
            logger.log('[PREFETCH] Successfully prefetched:', basePath);
          })
          .catch((error) => {
            logger.error('[PREFETCH] Failed to prefetch:', basePath, error);
            // Remove from set if failed so it can be retried
            prefetchedRoutes.delete(basePath);
          });
      } else {
        logger.log('[PREFETCH] No prefetch config for:', basePath);
      }
    }, 50); // 50ms debounce delay
  }, []);

  return prefetchRoute;
};

/**
 * Prefetch multiple related routes at once
 * Useful for prefetching likely navigation paths
 */
export const useBatchRoutePrefetch = () => {
  const prefetchRoute = useRoutePrefetch();

  const prefetchRoutes = useCallback((paths: string[]) => {
    paths.forEach((path, index) => {
      // Stagger prefetch requests to avoid network congestion
      setTimeout(() => {
        prefetchRoute(path);
      }, index * 100); // 100ms between each prefetch
    });
  }, [prefetchRoute]);

  return prefetchRoutes;
};

/**
 * Common navigation patterns for intelligent prefetching
 * Based on user behavior analysis
 */
export const COMMON_NAVIGATION_PATTERNS: Record<string, string[]> = {
  '/': ['/dashboard', '/marketplace', '/services'],
  '/dashboard': ['/settings', '/campaigns', '/marketplace'],
  '/marketplace': ['/services', '/service/:serviceId'],
  '/campaigns': ['/campaigns/launch', '/campaigns/my-campaigns'],
  '/settings': ['/dashboard'],
  '/admin-dashboard': [
    '/admin-dashboard/overview',
    '/admin-dashboard/users',
    '/admin-dashboard/campaigns'
  ],
};
