import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CheckEligibilityParams {
  topupAmount: number;
  topupTransactionId?: string;
}

export const useAwardedCreditsEligibility = (params?: CheckEligibilityParams) => {
  return useQuery({
    queryKey: ['awarded-credits-eligibility', params?.topupTransactionId],
    queryFn: async () => {
      if (!params || !params.topupAmount) {
        return {
          canUnlock: false,
          maxUnlock: 0,
          lockedBalance: 0,
          topupAmount: 0,
          expiringCredits: [],
          message: 'No top-up amount provided'
        };
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('check-awarded-credits-eligibility', {
        body: {
          topupAmount: params.topupAmount,
          topupTransactionId: params.topupTransactionId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data;
    },
    enabled: !!params && params.topupAmount > 0,
    staleTime: 0 // Always fetch fresh data
  });
};