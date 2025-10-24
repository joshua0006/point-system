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
      // Check if we're in a browser idle period to avoid blocking navigation
      // Warm common queries based on user role with lower priority
      const promises: Promise<any>[] = [];

      // Check if data is already cached - skip if so
      const cachedSubscription = queryClient.getQueryData(['subscription-status']);

      // Only prefetch subscription if not already cached
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

    // Use requestIdleCallback to warm cache during browser idle time
    // This prevents blocking navigation and initial page render
    // Fallback to setTimeout with longer delay (2s) if requestIdleCallback not available
    let idleCallbackId: number;
    let timeoutId: NodeJS.Timeout;

    if ('requestIdleCallback' in window) {
      idleCallbackId = requestIdleCallback(
        () => {
          warmCache();
        },
        { timeout: 3000 } // Max 3 seconds before forcing execution
      );
    } else {
      // Fallback for browsers without requestIdleCallback
      timeoutId = setTimeout(warmCache, 2000);
    }

    return () => {
      if (idleCallbackId) {
        cancelIdleCallback(idleCallbackId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [profile, queryClient]);
}

export default useCacheWarming;