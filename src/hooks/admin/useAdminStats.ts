import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentMonthStart } from "@/utils/admin/adminHelpers";

export interface AdminStats {
  totalUsers: number;
  activeConsultants: number;
  activeServices: number;
  activeBookings: number;
  monthlyVolume: number;
}

export function useAdminStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeConsultants: 0,
    activeServices: 0,
    activeBookings: 0,
    monthlyVolume: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch admin stats from RPC function
      const adminStatsResponse = await supabase.rpc('get_admin_stats');
      
      if (adminStatsResponse.error) {
        throw new Error(`Admin access denied: ${adminStatsResponse.error.message}`);
      }

      // Fetch monthly volume (current month purchases)
      const monthlyVolumeResponse = await supabase
        .from('flexi_credits_transactions')
        .select('amount')
        .eq('type', 'purchase')
        .gte('created_at', getCurrentMonthStart());

      const adminStatsData = adminStatsResponse.data as { 
        total_users: number; 
        active_consultants: number; 
        active_services: number; 
        active_bookings: number; 
      };

      const monthlyVolume = monthlyVolumeResponse.data?.reduce(
        (sum, t) => sum + Math.abs(t.amount), 
        0
      ) || 0;

      setStats({
        totalUsers: adminStatsData.total_users || 0,
        activeConsultants: adminStatsData.active_consultants || 0,
        activeServices: adminStatsData.active_services || 0,
        activeBookings: adminStatsData.active_bookings || 0,
        monthlyVolume,
      });

    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError('Failed to load admin statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  return {
    stats,
    loading,
    error,
    refreshStats: fetchStats
  };
}