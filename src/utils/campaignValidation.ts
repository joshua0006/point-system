import { supabase } from '@/integrations/supabase/client';

export type CampaignType = 'cold-calling' | 'va-support';
export type VATier = 'basic' | 'standard' | 'comprehensive';

export interface TierInfo {
  tier: VATier | number; // VATier for VA support, number (hours) for cold calling
  budget: number;
  name: string;
}

export interface ExistingCampaignCheck {
  hasActive: boolean;
  campaignDetails?: {
    id: string;
    participantId: string;
    name: string;
    type: CampaignType;
    joinedAt: string;
    billingStatus: string;
    currentBudget: number;
    tierInfo?: TierInfo;
  };
}

/**
 * Extract tier information from campaign name and budget
 */
export function getTierFromCampaign(
  campaignType: CampaignType,
  campaignName: string,
  budget: number
): TierInfo | undefined {
  if (campaignType === 'va-support') {
    // Extract tier from VA Support campaign name
    if (campaignName.includes('Basic')) {
      return { tier: 'basic', budget: 50, name: 'Basic VA Support' };
    } else if (campaignName.includes('Standard')) {
      return { tier: 'standard', budget: 75, name: 'Standard VA Support' };
    } else if (campaignName.includes('Comprehensive') || campaignName.includes('Premium')) {
      return { tier: 'comprehensive', budget: 100, name: 'Comprehensive VA Support' };
    }
    // Fallback based on budget
    if (budget === 50) return { tier: 'basic', budget: 50, name: 'Basic VA Support' };
    if (budget === 75) return { tier: 'standard', budget: 75, name: 'Standard VA Support' };
    if (budget === 100) return { tier: 'comprehensive', budget: 100, name: 'Comprehensive VA Support' };
  } else if (campaignType === 'cold-calling') {
    // Extract hours from Cold Calling campaign name (e.g., "Cold Calling Campaign - 10h/month")
    const match = campaignName.match(/(\d+)h\/month/);
    const hours = match ? parseInt(match[1]) : budget / 6; // 6 points per hour
    return { tier: hours, budget, name: `${hours}h/month Cold Calling` };
  }
  return undefined;
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
        monthly_budget,
        budget_contribution,
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
      const campaignName = (campaign as any).lead_gen_campaigns.name;
      const currentBudget = campaign.monthly_budget || campaign.budget_contribution;
      const tierInfo = getTierFromCampaign(campaignType, campaignName, currentBudget);

      return {
        hasActive: true,
        campaignDetails: {
          id: campaign.campaign_id,
          participantId: campaign.id,
          name: campaignName,
          type: campaignType,
          joinedAt: campaign.joined_at,
          billingStatus: campaign.billing_status || 'active',
          currentBudget,
          tierInfo,
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
 * Check if the requested plan is a tier change (upgrade/downgrade) vs duplicate
 */
export function isTierChange(
  existingBudget: number,
  newBudget: number
): { isTierChange: boolean; isUpgrade: boolean; isDowngrade: boolean } {
  const isSameTier = existingBudget === newBudget;
  const isUpgrade = newBudget > existingBudget;
  const isDowngrade = newBudget < existingBudget;

  return {
    isTierChange: !isSameTier,
    isUpgrade,
    isDowngrade,
  };
}

/**
 * Calculate the difference between tiers
 */
export function getTierDifference(existingBudget: number, newBudget: number): number {
  return newBudget - existingBudget;
}

/**
 * Get a user-friendly message for tier changes
 */
export function getTierChangeMessage(
  campaignType: CampaignType,
  isUpgrade: boolean,
  existingTierName: string,
  newTierName: string
): string {
  const typeLabel = campaignType === 'cold-calling' ? 'Cold Calling' : 'VA Support';
  const action = isUpgrade ? 'upgrade' : 'downgrade';

  return `You can ${action} your ${typeLabel} campaign from ${existingTierName} to ${newTierName}.`;
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
    return `You already have an active ${typeLabel} campaign ("${campaignName}"). You can upgrade or downgrade your current plan instead.`;
  }

  return `You already have an active ${typeLabel} campaign. You can upgrade or downgrade your current plan instead.`;
}
