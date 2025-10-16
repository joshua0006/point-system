import { supabase } from '@/integrations/supabase/client';

export type CampaignType = 'cold-calling' | 'va-support';

export interface ExistingCampaignCheck {
  hasActive: boolean;
  campaignDetails?: {
    id: string;
    name: string;
    type: CampaignType;
    joinedAt: string;
    billingStatus: string;
  };
}

/**
 * Check if a user already has an active campaign of the specified type
 * @param userId - The user's ID to check
 * @param campaignType - The type of campaign to check for ('cold-calling' or 'va-support')
 * @returns Promise with result indicating if user has an active campaign
 */
export async function checkExistingCampaign(
  userId: string,
  campaignType: CampaignType
): Promise<ExistingCampaignCheck> {
  try {
    // Determine the campaign name pattern based on type
    const namePattern = campaignType === 'cold-calling'
      ? 'Cold Calling Campaign%'
      : 'VA Support Campaign%';

    // Query for active campaigns matching the pattern
    const { data, error } = await supabase
      .from('campaign_participants')
      .select(`
        id,
        campaign_id,
        billing_status,
        joined_at,
        lead_gen_campaigns!inner(
          id,
          name,
          status
        )
      `)
      .eq('user_id', userId)
      .eq('billing_status', 'active')
      .like('lead_gen_campaigns.name', namePattern)
      .eq('lead_gen_campaigns.status', 'active')
      .order('joined_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error checking existing campaign:', error);
      throw error;
    }

    // If we found an active campaign, return the details
    if (data && data.length > 0) {
      const campaign = data[0];
      return {
        hasActive: true,
        campaignDetails: {
          id: campaign.campaign_id,
          name: (campaign as any).lead_gen_campaigns.name,
          type: campaignType,
          joinedAt: campaign.joined_at,
          billingStatus: campaign.billing_status || 'active',
        },
      };
    }

    // No active campaign found
    return {
      hasActive: false,
    };
  } catch (error) {
    console.error('Error in checkExistingCampaign:', error);
    // In case of error, return false to not block the user unnecessarily
    // The error will be logged for investigation
    return {
      hasActive: false,
    };
  }
}

/**
 * Get a user-friendly error message for when they try to create a duplicate campaign
 * @param campaignType - The type of campaign
 * @param campaignName - Optional name of the existing campaign
 * @returns User-friendly error message
 */
export function getDuplicateCampaignErrorMessage(
  campaignType: CampaignType,
  campaignName?: string
): string {
  const typeLabel = campaignType === 'cold-calling' ? 'Cold Calling' : 'VA Support';

  if (campaignName) {
    return `You already have an active ${typeLabel} campaign ("${campaignName}"). Please pause or cancel your existing campaign before creating a new one.`;
  }

  return `You already have an active ${typeLabel} campaign. Please pause or cancel your existing campaign before creating a new one.`;
}
