import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AdminOperationsResult {
  success: boolean;
  message: string;
  data?: any;
}

export function useAdminOperations() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const executeOperation = async (
    operation: () => Promise<any>,
    successMessage: string,
    errorMessage: string
  ): Promise<AdminOperationsResult> => {
    if (!user) {
      return { success: false, message: "User not authenticated" };
    }

    setLoading(true);
    try {
      const result = await operation();
      setLoading(false);
      return { success: true, message: successMessage, data: result };
    } catch (error: any) {
      setLoading(false);
      console.error('Admin operation error:', error);
      return { 
        success: false, 
        message: error.message || errorMessage 
      };
    }
  };

  const updateUserCredits = async (
    userId: string, 
    amount: number, 
    type: 'credit' | 'debit',
    reason?: string
  ): Promise<AdminOperationsResult> => {
    return executeOperation(
      async () => {
        const { data, error } = await supabase.functions.invoke('manual-add-points', {
          body: {
            userId,
            amount: type === 'debit' ? -Math.abs(amount) : Math.abs(amount),
            reason: reason || `Admin ${type} operation`
          }
        });
        if (error) throw error;
        return data;
      },
      `Successfully ${type === 'credit' ? 'added' : 'deducted'} ${amount} credits`,
      `Failed to ${type} user credits`
    );
  };

  const updateUserStatus = async (
    userId: string, 
    status: 'approved' | 'pending' | 'rejected',
    reason?: string
  ): Promise<AdminOperationsResult> => {
    return executeOperation(
      async () => {
        const { data, error } = await supabase.functions.invoke('admin-user-management', {
          body: {
            action: 'update_status',
            userId,
            status,
            reason
          }
        });
        if (error) throw error;
        return data;
      },
      `User status updated to ${status}`,
      'Failed to update user status'
    );
  };

  const revokeUserAccess = async (
    userId: string, 
    reason: string
  ): Promise<AdminOperationsResult> => {
    return executeOperation(
      async () => {
        const { data, error } = await supabase.functions.invoke('admin-user-management', {
          body: {
            action: 'revoke_access',
            userId,
            reason: reason.trim()
          }
        });
        if (error) throw error;
        return data;
      },
      'User access successfully revoked',
      'Failed to revoke user access'
    );
  };

  const deleteUser = async (
    userId: string, 
    reason: string
  ): Promise<AdminOperationsResult> => {
    return executeOperation(
      async () => {
        const { data, error } = await supabase.functions.invoke('admin-user-management', {
          body: {
            action: 'delete_user',
            userId,
            reason: reason.trim()
          }
        });
        if (error) throw error;
        return data;
      },
      'User successfully deleted',
      'Failed to delete user'
    );
  };

  const bulkUpdateUsers = async (
    userIds: string[],
    operation: 'approve' | 'reject' | 'credit' | 'debit',
    params?: { amount?: number; reason?: string }
  ): Promise<AdminOperationsResult> => {
    return executeOperation(
      async () => {
        const results = await Promise.allSettled(
          userIds.map(userId => {
            switch (operation) {
              case 'approve':
                return updateUserStatus(userId, 'approved', params?.reason);
              case 'reject':
                return updateUserStatus(userId, 'rejected', params?.reason);
              case 'credit':
                return updateUserCredits(userId, params?.amount || 0, 'credit', params?.reason);
              case 'debit':
                return updateUserCredits(userId, params?.amount || 0, 'debit', params?.reason);
              default:
                throw new Error('Invalid bulk operation');
            }
          })
        );
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        return { successful, failed, total: userIds.length };
      },
      `Bulk operation completed: ${operation}`,
      `Failed to complete bulk ${operation} operation`
    );
  };

  return {
    loading,
    updateUserCredits,
    updateUserStatus,
    revokeUserAccess,
    deleteUser,
    bulkUpdateUsers
  };
}