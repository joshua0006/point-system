import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface UserCampaign {
  id: string;
  campaign_id: string;
  consultant_name: string;
  budget_contribution: number;
  leads_received: number;
  conversions: number;
  billing_status: string;
  next_billing_date: string;
  joined_at: string;
  lead_gen_campaigns: {
    id: string;
    name: string;
    status: string;
  };
}

export function useUserCampaigns() {
  const { user } = useAuth();

  const { data: campaigns = [], isLoading, refetch } = useQuery({
    queryKey: ['user-campaigns', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('campaign_participants')
        .select(`
          id,
          campaign_id,
          consultant_name,
          budget_contribution,
          leads_received,
          conversions,
          billing_status,
          next_billing_date,
          joined_at,
          lead_gen_campaigns!inner(
            id,
            name,
            status
          )
        `)
        .eq('user_id', user.id)
        .eq('billing_status', 'active')
        .order('joined_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error fetching campaigns:', error);
        throw error;
      }

      return (data || []) as UserCampaign[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: true, // Enable refetch on tab switch for real-time sync
  });

  // Real-time subscription for campaign updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('user-campaigns-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_participants',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[useUserCampaigns] Real-time update:', payload);
          // Refetch campaigns when any change occurs
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  return {
    campaigns,
    isLoading,
    refreshCampaigns: refetch,
  };
}