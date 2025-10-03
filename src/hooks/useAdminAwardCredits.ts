import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AwardCreditsParams {
  userId: string;
  amount: number;
  reason: string;
}

export const useAdminAwardCredits = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, amount, reason }: AwardCreditsParams) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('award-flexi-credits', {
        body: { userId, amount, reason },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data;
    },
    onSuccess: (data) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['awarded-credits'] });
      
      toast.success('Awarded flexi credits successfully!', {
        description: data.message
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to award credits', {
        description: error.message
      });
    }
  });
};