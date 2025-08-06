import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RegenerateScriptParams {
  scriptType: 'call' | 'sms' | 'followup';
  targetAudience: string;
  campaignAngle: string;
  customRequirements?: string;
}

export const useScriptRegeneration = () => {
  const [isLoading, setIsLoading] = useState(false);

  const regenerateScript = async (params: RegenerateScriptParams): Promise<string> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-campaign-scripts', {
        body: {
          scriptType: params.scriptType,
          targetAudience: params.targetAudience,
          campaignAngle: params.campaignAngle,
          customRequirements: params.customRequirements
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to regenerate script');
      }

      if (!data?.script) {
        throw new Error('No script returned from AI');
      }

      return data.script;
    } catch (error) {
      console.error('Script regeneration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    regenerateScript,
    isLoading
  };
};