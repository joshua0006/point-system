import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ServiceAssignment {
  id: string;
  user_id: string;
  service_type: string;
  service_level: string;
  monthly_cost: number;
  assignment_date: string;
  next_billing_date: string;
  status: string;
  notes?: string;
  assigned_by: string;
  created_at: string;
  updated_at: string;
}

interface AssignServiceParams {
  userId: string;
  serviceType: string;
  serviceLevel: string;
  monthlyCost: number;
  nextBillingDate: Date;
  notes?: string;
}

export function useServiceAssignments() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'master_admin';

  // Fetch user's service assignments
  const fetchUserAssignments = (userId: string) => {
    return useQuery({
      queryKey: ['service-assignments', userId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('admin_service_assignments' as any)
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return (data as any) as ServiceAssignment[];
      },
      enabled: !!userId,
    });
  };

  // Assign service mutation
  const assignServiceMutation = useMutation({
    mutationFn: async (params: AssignServiceParams) => {
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      const { data, error } = await supabase
        .from('admin_service_assignments' as any)
        .insert({
          user_id: params.userId,
          service_type: params.serviceType,
          service_level: params.serviceLevel,
          monthly_cost: params.monthlyCost,
          next_billing_date: params.nextBillingDate.toISOString().split('T')[0],
          notes: params.notes,
          assigned_by: profile?.user_id,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['service-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  // Update service assignment
  const updateServiceMutation = useMutation({
    mutationFn: async ({ assignmentId, updates }: { assignmentId: string; updates: Partial<ServiceAssignment> }) => {
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      const { data, error } = await supabase
        .from('admin_service_assignments' as any)
        .update(updates)
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-assignments'] });
    },
  });

  // Cancel service assignment
  const cancelServiceMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      const { data, error } = await supabase
        .from('admin_service_assignments' as any)
        .update({ status: 'cancelled' })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-assignments'] });
    },
  });

  return {
    fetchUserAssignments,
    assignService: assignServiceMutation.mutateAsync,
    updateService: updateServiceMutation.mutateAsync,
    cancelService: cancelServiceMutation.mutateAsync,
    isAssigning: assignServiceMutation.isPending,
    isUpdating: updateServiceMutation.isPending,
    isCancelling: cancelServiceMutation.isPending,
  };
}