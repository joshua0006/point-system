import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AdminStats {
  totalUsers: number;
  activeConsultants: number;
  activeServices: number;
  activeBookings: number;
  monthlyVolume: number;
}

export function useAdminStats() {
  const { profile } = useAuth();
  const isAdminUser = profile?.role === 'admin' || profile?.role === 'master_admin';

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refreshStats,
  } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // Batch both queries in parallel
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
    enabled: isAdminUser,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });

  return {
    stats,
    statsLoading,
    statsError,
    refreshStats,
  };
}