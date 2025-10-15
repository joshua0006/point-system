import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AwardedCredit {
  id: string;
  user_id: string;
  amount: number;
  locked_amount: number;
  unlocked_amount: number;
  awarded_by: string;
  awarded_date: string;
  expires_at: string;
  status: 'active' | 'expired' | 'fully_unlocked';
  reason: string;
  created_at: string;
  updated_at: string;
}

export interface ExpiringCredit {
  id: string;
  amount: number;
  expires_at: string;
  days_until_expiry: number;
}

export const useAwardedCredits = () => {
  return useQuery({
    queryKey: ['awarded-credits'],
    queryFn: async () => {
      console.log('[UNLOCK-DEBUG] useAwardedCredits: Fetching awarded credits from DB');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('awarded_flexi_credits')
        .select('*')
        .eq('user_id', user.id)
        .order('awarded_date', { ascending: false });

      if (error) throw error;

      const awards = data as AwardedCredit[];
      
      // Calculate total locked balance
      const lockedBalance = awards
        .filter(a => a.status === 'active' && Number(a.locked_amount) > 0)
        .reduce((sum, a) => sum + Number(a.locked_amount), 0);

      // Calculate total unlocked balance
      const unlockedBalance = awards.reduce((sum, a) => sum + Number(a.unlocked_amount), 0);

      // Find expiring credits (within 30 days)
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const expiringCredits: ExpiringCredit[] = awards
        .filter(a => 
          a.status === 'active' && 
          Number(a.locked_amount) > 0 &&
          new Date(a.expires_at) <= thirtyDaysFromNow
        )
        .map(a => ({
          id: a.id,
          amount: Number(a.locked_amount),
          expires_at: a.expires_at,
          days_until_expiry: Math.floor(
            (new Date(a.expires_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
          )
        }))
        .sort((a, b) => a.days_until_expiry - b.days_until_expiry);

      console.log('[UNLOCK-DEBUG] useAwardedCredits: Calculated balances', {
        lockedBalance,
        unlockedBalance,
        totalAwards: awards.length,
        activeAwards: awards.filter(a => a.status === 'active').length,
        timestamp: new Date().toISOString(),
        rawAwards: awards.map(a => ({ id: a.id, locked: a.locked_amount, unlocked: a.unlocked_amount }))
      });

      return {
        awards,
        lockedBalance,
        unlockedBalance,
        expiringCredits,
        hasExpiringCredits: expiringCredits.length > 0
      };
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });
};