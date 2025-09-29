import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CampaignTemplate {
  id: string;
  name: string;
  description?: string;
  target_audience: string;
  campaign_angle: string;
  template_config: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useCampaignTemplates() {
  return useQuery({
    queryKey: ['campaign-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as CampaignTemplate[];
    },
  });
}