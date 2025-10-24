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
      // PERFORMANCE: Skip if data already cached
      const promises: Promise<any>[] = [];

      // Check if subscription data is already cached
      const cachedSubscription = queryClient.getQueryData(['subscription-status']);

      // Skip subscription prefetch - already loaded in AuthContext parallel fetch
      // Only prefetch if truly missing (very rare edge case)
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

      // Execute prefetch operations (skip if nothing to prefetch)
      if (promises.length === 0) {
        return; // All data already cached
      }

      try {
        await Promise.allSettled(promises);
      } catch (error) {
        console.warn('Cache warming failed:', error);
      }
    };

    // PERFORMANCE: Balanced delay for initial load optimization
    // Cache warming happens after initial render completes
    let idleCallbackId: number;
    let timeoutId: NodeJS.Timeout;
    let interactionListener: (() => void) | null = null;

    const triggerCacheWarming = () => {
      warmCache();

      // Clean up listeners
      if (interactionListener) {
        ['click', 'keydown', 'scroll', 'touchstart'].forEach(event => {
          window.removeEventListener(event, interactionListener!, { capture: true });
        });
        interactionListener = null;
      }
    };

    // Listen for first user interaction (immediate cache warm)
    interactionListener = triggerCacheWarming;
    ['click', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      window.addEventListener(event, interactionListener!, { capture: true, once: true });
    });

    // Fallback: Warm cache after 2 seconds if no interaction
    if ('requestIdleCallback' in window) {
      idleCallbackId = requestIdleCallback(triggerCacheWarming, { timeout: 2000 });
    } else {
      timeoutId = setTimeout(triggerCacheWarming, 2000);
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