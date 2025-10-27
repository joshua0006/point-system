/**
 * Navigation Components with Intelligent Prefetching
 *
 * Enhanced Link/NavLink components that automatically prefetch route chunks
 * on hover for instant page transitions.
 *
 * @example
 * ```tsx
 * import { PrefetchLink, PrefetchNavLink } from '@/components/navigation';
 *
 * // Use in content
 * <PrefetchLink to="/dashboard">Dashboard</PrefetchLink>
 *
 * // Use in navigation
 * <PrefetchNavLink to="/settings">Settings</PrefetchNavLink>
 * ```
 */

export { PrefetchLink } from './PrefetchLink';
export type { PrefetchLinkProps } from './PrefetchLink';

export { PrefetchNavLink } from './PrefetchNavLink';
export type { PrefetchNavLinkProps } from './PrefetchNavLink';
