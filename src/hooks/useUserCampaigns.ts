import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const [campaigns, setCampaigns] = useState<UserCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCampaigns = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
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
        return;
      }

      setCampaigns(data || []);
    } catch (error) {
      console.error('Error in fetchCampaigns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [user?.id]);

  return {
    campaigns,
    isLoading,
    refreshCampaigns: fetchCampaigns
  };
}