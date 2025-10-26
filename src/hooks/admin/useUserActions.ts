import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@/config/types";

export function useUserActions() {
  const { toast } = useToast();

  const approveUser = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-user-management', {
        body: { 
          action: 'approve_user',
          userId 
        }
      });

      if (error) throw error;

      toast({
        title: "User Approved",
        description: "User has been successfully approved.",
      });

      return true;
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: "Error",
        description: "Failed to approve user. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const revokeUser = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-user-management', {
        body: { 
          action: 'revoke_user',
          userId 
        }
      });

      if (error) throw error;

      toast({
        title: "User Revoked",
        description: "User access has been revoked.",
      });

      return true;
    } catch (error) {
      console.error('Error revoking user:', error);
      toast({
        title: "Error",
        description: "Failed to revoke user access. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-user-management', {
        body: { 
          action: 'delete_user',
          userId 
        }
      });

      if (error) throw error;

      toast({
        title: "User Deleted",
        description: "User has been permanently deleted.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const updateUserCredits = useCallback(async (userId: string, amount: number, description?: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-user-management', {
        body: { 
          action: 'update_credits',
          userId,
          amount,
          description
        }
      });

      if (error) throw error;

      toast({
        title: "Credits Updated",
        description: `Successfully ${amount > 0 ? 'added' : 'deducted'} ${Math.abs(amount)} credits.`,
      });

      return true;
    } catch (error) {
      console.error('Error updating credits:', error);
      toast({
        title: "Error",
        description: "Failed to update credits. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const toggleHideUser = useCallback(async (userId: string) => {
    console.log('[toggleHideUser] Called with userId:', userId);
    try {
      console.log('[toggleHideUser] Invoking edge function...');
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { 
          action: 'toggle_hide_user',
          userId 
        }
      });

      console.log('[toggleHideUser] Response:', { data, error });

      if (error) throw error;

      toast({
        title: data.isHidden ? "User Hidden" : "User Unhidden",
        description: data.message,
      });

      return true;
    } catch (error) {
      console.error('[toggleHideUser] Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to toggle user visibility. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  return {
    approveUser,
    revokeUser,
    deleteUser,
    updateUserCredits,
    toggleHideUser,
  };
}