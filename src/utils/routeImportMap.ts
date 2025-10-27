/**
 * Route Import Mapping System
 *
 * Centralized mapping of route paths to their dynamic import functions.
 * Used by PrefetchLink/PrefetchNavLink for hover-based chunk prefetching.
 *
 * IMPORTANT: Keep this map in sync with src/config/routes.ts
 */

/**
 * Static route mappings (exact path matches)
 */
export const routeImportMap: Record<string, () => Promise<any>> = {
  // Core routes
  '/': () => import('@/pages/Index'),
  '/auth': () => import('@/pages/Auth'),

  // User dashboards
  '/dashboard': () => import('@/pages/UserDashboard'),
  '/consultant-dashboard': () => import('@/pages/ConsultantDashboard'),
  '/seller-dashboard': () => import('@/pages/SellerDashboard'),

  // Admin routes
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

  // Marketplace & Services
  '/marketplace': () => import('@/pages/Marketplace'),
  '/services': () => import('@/pages/Services'),

  // Campaigns
  '/campaigns': () => import('@/pages/Campaigns'),
  '/campaigns/launch': () => import('@/pages/CampaignLaunch'),
  '/campaigns/my-campaigns': () => import('@/pages/MyCampaigns'),
  '/campaigns/facebook-ads': () => import('@/pages/FacebookAdsCampaigns'),
  '/campaigns/cold-calling': () => import('@/pages/ColdCallingCampaigns'),
  '/campaigns/va-support': () => import('@/pages/VASupportCampaigns'),

  // Gifting
  '/gifting': () => import('@/pages/Gifting'),

  // AI & Tools
  '/ai-assistant': () => import('@/pages/AIAssistant'),
  '/ad-copy-generator': () => import('@/pages/AdCopyGenerator'),
  '/user-flows': () => import('@/pages/UserFlows'),

  // Settings & Profile
  '/settings': () => import('@/pages/Settings'),
  '/settings/profile': () => import('@/pages/Settings'),
  '/settings/billing': () => import('@/pages/Settings'),
  '/settings/notifications': () => import('@/pages/Settings'),

  // Thank you page
  '/thank-you': () => import('@/pages/ThankYou'),
};

/**
 * Get import function for a given path, including dynamic route matching
 *
 * @param path - The route path to match
 * @returns Import function for the route, or undefined if not found
 *
 * @example
 * ```ts
 * const importFn = getImportForPath('/service/123');
 * // Returns: () => import('@/pages/ServiceDetail')
 * ```
 */
export function getImportForPath(path: string): (() => Promise<any>) | undefined {
  // Try exact match first (fastest)
  if (routeImportMap[path]) {
    return routeImportMap[path];
  }

  // Dynamic route pattern matching
  // Service details
  if (path.startsWith('/service/')) {
    return () => import('@/pages/ServiceDetail');
  }

  // Profile pages
  if (path.startsWith('/profile/consultant/') || path.startsWith('/consultant/')) {
    return () => import('@/pages/ConsultantProfile');
  }

  if (path.startsWith('/profile/buyer/') || path.startsWith('/buyer/')) {
    return () => import('@/pages/BuyerProfile');
  }

  if (path.startsWith('/profile/seller/') || path.startsWith('/seller/')) {
    return () => import('@/pages/SellerProfile');
  }

  // Settings with tabs
  if (path.startsWith('/settings/')) {
    return () => import('@/pages/Settings');
  }

  // Dashboard with query params
  if (path.startsWith('/dashboard?')) {
    return () => import('@/pages/UserDashboard');
  }

  // No match found
  return undefined;
}

/**
 * Preload a route chunk (used for programmatic prefetching)
 *
 * @param path - Route path to preload
 * @returns Promise that resolves when chunk is loaded
 *
 * @example
 * ```ts
 * await preloadRoute('/dashboard');
 * // Dashboard chunk now cached in browser
 * ```
 */
export async function preloadRoute(path: string): Promise<void> {
  const importFn = getImportForPath(path);
  if (importFn) {
    try {
      await importFn();
    } catch (error) {
      // Silently fail - prefetch is optional optimization
      console.debug(`Route prefetch failed for ${path} (non-critical)`, error);
    }
  }
}

/**
 * Check if a route has a registered import function
 *
 * @param path - Route path to check
 * @returns True if route can be prefetched
 */
export function canPrefetchRoute(path: string): boolean {
  return getImportForPath(path) !== undefined;
}
