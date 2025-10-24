import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useCacheWarming() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile) return;

    const warmCache = async () => {
      // PERFORMANCE: Delay cache warming to avoid blocking initial page render
      // Wait for user interaction or idle time before prefetching
      const promises: Promise<any>[] = [];

      // Check if data is already cached - skip if so
      const cachedSubscription = queryClient.getQueryData(['subscription-status']);

      // DEFERRED: Subscription already loaded in AuthContext, skip redundant fetch
      // Only prefetch if truly missing (rare edge case)
      if (!cachedSubscription) {
        promises.push(
          queryClient.prefetchQuery({
            queryKey: ['subscription-status'],
            queryFn: async () => {
              const { data } = await supabase.functions.invoke('check-subscription');
              return data;
            },
            staleTime: 1000 * 60 * 5, // 5 minutes
          })
        );
      }

      // For admin users, warm admin data (only if not cached)
      if (profile.role === 'admin' || profile.role === 'master_admin') {
        const cachedAdminStats = queryClient.getQueryData(['admin-stats']);

        if (!cachedAdminStats) {
          promises.push(
            queryClient.prefetchQuery({
              queryKey: ['admin-stats'],
              queryFn: async () => {
                const [statsResult, monthlyResult] = await Promise.all([
                  supabase.rpc('get_admin_stats'),
                  supabase
                    .from('flexi_credits_transactions')
                    .select('amount')
                    .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
                ]);

                if (statsResult.error) throw statsResult.error;

                const monthlyVolume = monthlyResult.data?.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;

                return {
                  totalUsers: (statsResult.data as any)?.total_users || 0,
                  activeConsultants: (statsResult.data as any)?.active_consultants || 0,
                  activeServices: (statsResult.data as any)?.active_services || 0,
                  activeBookings: (statsResult.data as any)?.active_bookings || 0,
                  monthlyVolume,
                };
              },
              staleTime: 1000 * 60 * 2,
            })
          );
        }
      }

      // For regular users, warm dashboard data (only if not cached)
      if (profile.role === 'consultant' || !profile.role) {
        const cachedTransactions = queryClient.getQueryData(['flexi-transactions']);

        if (!cachedTransactions) {
          promises.push(
            queryClient.prefetchQuery({
              queryKey: ['flexi-transactions'],
              queryFn: async () => {
                const { data } = await supabase
                  .from('flexi_credits_transactions')
                  .select('id, type, amount, created_at, description, booking_id, bookings(services(title, consultant_id, consultants(user_id)))')
                  .eq('user_id', profile.id)
                  .order('created_at', { ascending: false })
                  .limit(50);
                return data || [];
              },
              staleTime: 1000 * 30,
            })
          );
        }
      }

      // Execute all prefetch operations in parallel (only if there's something to prefetch)
      if (promises.length === 0) {
        console.log('Cache warming skipped - all data already cached');
        return;
      }

      try {
        await Promise.allSettled(promises);
        console.log('Cache warming completed:', promises.length, 'queries prefetched');
      } catch (error) {
        console.warn('Cache warming partially failed:', error);
      }
    };

    // PERFORMANCE OPTIMIZATION: Delay cache warming significantly
    // Use requestIdleCallback with extended timeout to avoid blocking initial load
    // Cache warming is a nice-to-have, not critical for first render
    let idleCallbackId: number;
    let timeoutId: NodeJS.Timeout;
    let interactionListener: (() => void) | null = null;

    // Strategy: Warm cache on first user interaction OR after 5 seconds idle
    const triggerCacheWarming = () => {
      warmCache();

      // Clean up interaction listeners after first trigger
      if (interactionListener) {
        ['click', 'keydown', 'scroll', 'touchstart'].forEach(event => {
          window.removeEventListener(event, interactionListener!, { capture: true });
        });
        interactionListener = null;
      }
    };

    // Setup interaction listener for immediate cache warming on user action
    interactionListener = () => {
      triggerCacheWarming();
    };

    // Listen for first user interaction
    ['click', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      window.addEventListener(event, interactionListener!, { capture: true, once: true });
    });

    // Fallback: Use requestIdleCallback with extended delay
    if ('requestIdleCallback' in window) {
      idleCallbackId = requestIdleCallback(
        () => {
          triggerCacheWarming();
        },
        { timeout: 5000 } // Extended to 5 seconds - cache warming is non-critical
      );
    } else {
      // Fallback for browsers without requestIdleCallback - extended delay
      timeoutId = setTimeout(triggerCacheWarming, 5000);
    }

    return () => {
      if (idleCallbackId) {
        cancelIdleCallback(idleCallbackId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Clean up interaction listeners
      if (interactionListener) {
        ['click', 'keydown', 'scroll', 'touchstart'].forEach(event => {
          window.removeEventListener(event, interactionListener!, { capture: true });
        });
      }
    };
  }, [profile, queryClient]);
}

export default useCacheWarming;