import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useAdminUsers() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const isAdminUser = profile?.role === 'admin' || profile?.role === 'master_admin';

  // Fetch all users
  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
    refetch: refreshUsers,
  } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'list_users' }
      });
      
      if (error) throw error;
      return data?.users || [];
    },
    enabled: isAdminUser,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch pending users
  const {
    data: pendingUsers,
    isLoading: pendingLoading,
    refetch: refreshPendingUsers,
  } = useQuery({
    queryKey: ['admin-pending-users'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'list_pending_users' }
      });
      
      if (error) throw error;
      return data?.users || [];
    },
    enabled: isAdminUser,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // User management mutation
  const userMutation = useMutation({
    mutationFn: async ({ action, userId, ...params }: any) => {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action, userId, ...params }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const refreshAllUsers = () => {
    refreshUsers();
    refreshPendingUsers();
  };

  return {
    users: users || [],
    usersLoading,
    usersError,
    pendingUsers: pendingUsers || [],
    pendingLoading,
    refreshUsers,
    refreshPendingUsers,
    refreshAllUsers,
    updateUser: userMutation.mutate,
    updateUserAsync: userMutation.mutateAsync,
    isUpdating: userMutation.isPending,
    isLoading: usersLoading || pendingLoading,
  };
}