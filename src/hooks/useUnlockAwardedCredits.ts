import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UnlockAwardedCreditsParams {
  topupTransactionId: string;
  amountToUnlock: number;
}

export const useUnlockAwardedCredits = () => {
  const queryClient = useQueryClient();

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
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['awarded-credits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['flexi-credits-transactions'] });
      
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