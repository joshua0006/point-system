import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { UserProfile } from "@/config/types";

export function useOptimizedAdminData() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Batch all admin queries in parallel for faster loading
  const isAdminUser = profile?.role === 'admin' || profile?.role === 'master_admin';

  // Admin stats with optimized batching
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
    staleTime: 1000 * 60 * 2, // 2 minutes for faster updates
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // Batch users and pending users queries in parallel
  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
    refetch: refreshUsers,
  } = useQuery({
    queryKey: ['admin-users-batch'],
    queryFn: async () => {
      // Batch both user queries in parallel
      const [usersResult, pendingResult] = await Promise.all([
        supabase.functions.invoke('admin-user-management', {
          body: { action: 'list_users' }
        }),
        supabase.functions.invoke('admin-user-management', {
          body: { action: 'list_pending_users' }
        })
      ]);

      if (usersResult.error) throw usersResult.error;
      if (pendingResult.error) throw pendingResult.error;

      return {
        users: usersResult.data?.users || [],
        pendingUsers: pendingResult.data?.users || []
      };
    },
    enabled: isAdminUser,
    staleTime: 1000 * 15, // 15 seconds for user data
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Extract users and pending users from batched query
  const users = usersData?.users || [];
  const pendingUsers = usersData?.pendingUsers || [];
  const pendingLoading = usersLoading;

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
    refreshPendingUsers: refreshUsers, // Use same refresh function since they're batched
    
    // Mutations
    updateUser: updateUserMutation.mutate,
    updateUserAsync: updateUserMutation.mutateAsync,
    isUpdating: updateUserMutation.isPending,
    
    // Overall loading state
    isLoading: statsLoading || usersLoading || pendingLoading,
  };
}