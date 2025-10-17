import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface UnlockAwardedCreditsParams {
  topupTransactionId: string;
  amountToUnlock: number;
}

export const useUnlockAwardedCredits = () => {
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();

  return useMutation({
    mutationFn: async ({ topupTransactionId, amountToUnlock }: UnlockAwardedCreditsParams) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('unlock-awarded-credits', {
        body: { topupTransactionId, amountToUnlock },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data;
    },
    onSuccess: async (data) => {
      console.log('[UNLOCK-DEBUG] useUnlockAwardedCredits: Success handler triggered', {
        amountUnlocked: data.data.amount_unlocked,
        newBalance: data.data.new_balance,
        unlockRecords: data.data.unlock_records
      });

      // Refresh AuthContext profile to update balance immediately
      await refreshProfile();
      console.log('[UNLOCK-DEBUG] useUnlockAwardedCredits: Profile refreshed');

      // Invalidate relevant queries in parallel for performance
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['awarded-credits'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['flexi-credits-transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-transactions'] })
      ]);
      console.log('[UNLOCK-DEBUG] useUnlockAwardedCredits: All queries invalidated');

      toast.success(`Successfully unlocked ${data.data.amount_unlocked} flexi credits!`, {
        description: `New balance: ${data.data.new_balance} FXC`
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to unlock credits', {
        description: error.message
      });
    }
  });
};