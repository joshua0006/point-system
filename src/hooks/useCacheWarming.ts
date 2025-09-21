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
      // Warm common queries based on user role
      const promises: Promise<any>[] = [];

      // Always warm user profile and subscription data
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

      // For admin users, warm admin data
      if (profile.role === 'admin' || profile.role === 'master_admin') {
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

      // For regular users, warm dashboard data
      if (profile.role === 'consultant' || !profile.role) {
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

      // Execute all prefetch operations in parallel
      try {
        await Promise.allSettled(promises);
        console.log('Cache warming completed');
      } catch (error) {
        console.warn('Cache warming partially failed:', error);
      }
    };

    // Warm cache after a short delay to not block initial render
    const timer = setTimeout(warmCache, 500);

    return () => clearTimeout(timer);
  }, [profile, queryClient]);
}

export default useCacheWarming;