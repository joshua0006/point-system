import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { UserProfile } from "@/config/types";

export function useOptimizedAdminData() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Admin stats query
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refreshStats,
  } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_stats');
      if (error) throw error;

      // Get monthly volume
      const { data: monthlyData } = await supabase
        .from('flexi_credits_transactions')
        .select('amount')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      const monthlyVolume = monthlyData?.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;

      return {
        totalUsers: (data as any)?.total_users || 0,
        activeConsultants: (data as any)?.active_consultants || 0,
        activeServices: (data as any)?.active_services || 0,
        activeBookings: (data as any)?.active_bookings || 0,
        monthlyVolume,
      };
    },
    enabled: profile?.role === 'admin' || profile?.role === 'master_admin',
    staleTime: 1000 * 60 * 5, // 5 minutes - can be longer for stats
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus for stats
  });

  // Users list query with optimized pagination
  const {
    data: users = [],
    isLoading: usersLoading,
    error: usersError,
    refetch: refreshUsers,
  } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async (): Promise<UserProfile[]> => {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'list_users' }
      });
      if (error) throw error;
      return data.users || [];
    },
    enabled: profile?.role === 'admin' || profile?.role === 'master_admin',
    staleTime: 1000 * 30, // 30 seconds for user data
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false, // Real-time updates handle this
  });

  // Pending users query
  const {
    data: pendingUsers = [],
    isLoading: pendingLoading,
    refetch: refreshPendingUsers,
  } = useQuery({
    queryKey: ['admin-pending-users'],
    queryFn: async (): Promise<UserProfile[]> => {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'list_pending_users' }
      });
      if (error) throw error;
      return data.users || [];
    },
    enabled: profile?.role === 'admin' || profile?.role === 'master_admin',
    staleTime: 1000 * 15, // 15 seconds for pending users (more urgent)
    gcTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
  });

  // User management mutations
  const updateUserMutation = useMutation({
    mutationFn: async ({ action, userId, ...params }: any) => {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action, userId, ...params }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch user-related queries
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  return {
    // Stats
    stats,
    statsLoading,
    statsError,
    refreshStats,
    
    // Users
    users,
    usersLoading,
    usersError,
    refreshUsers,
    
    // Pending users
    pendingUsers,
    pendingLoading,
    refreshPendingUsers,
    
    // Mutations
    updateUser: updateUserMutation.mutate,
    updateUserAsync: updateUserMutation.mutateAsync,
    isUpdating: updateUserMutation.isPending,
    
    // Overall loading state
    isLoading: statsLoading || usersLoading || pendingLoading,
  };
}