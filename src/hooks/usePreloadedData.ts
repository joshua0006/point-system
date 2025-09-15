import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PreloadedCampaignData {
  campaignTargets: any[];
  campaignTemplates: any[];
  userProfile: any;
}

export const usePreloadedData = () => {
  const { user } = useAuth();
  const [preloadedData, setPreloadedData] = useState<PreloadedCampaignData | null>(null);
  const [loading, setLoading] = useState(false);

  const preloadCampaignData = async () => {
    if (!user || preloadedData) return; // Don't reload if already loaded
    
    setLoading(true);
    try {
      // Batch fetch all campaign-related data
      const [templatesResult, profileResult] = await Promise.all([
        supabase
          .from('campaign_templates')
          .select('*')
          .eq('is_active', true),
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
      ]);

      setPreloadedData({
        campaignTargets: [], // Will be populated by specific components
        campaignTemplates: templatesResult.data || [],
        userProfile: profileResult.data
      });
    } catch (error) {
      console.error('Failed to preload campaign data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Start preloading when user is available
  useEffect(() => {
    if (user) {
      // Small delay to let the main page load first
      setTimeout(preloadCampaignData, 100);
    }
  }, [user]);

  return { preloadedData, loading, preloadCampaignData };
};