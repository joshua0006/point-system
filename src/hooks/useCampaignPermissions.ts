import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserPermission {
  id: string;
  target_audience: string;
  campaign_type: string;
  can_view: boolean;
  can_participate: boolean;
  can_manage: boolean;
  min_budget?: number;
  max_budget?: number;
}

interface AccessRule {
  id: string;
  target_audience: string;
  campaign_type: string;
  required_user_tier: string;
  required_completed_campaigns: number;
  min_budget?: number;
  max_budget?: number;
  is_active: boolean;
}

export const useCampaignPermissions = () => {
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [accessRules, setAccessRules] = useState<AccessRule[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPermissions();
    }
  }, [user]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);

      // Fetch user-specific permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_campaign_permissions')
        .select('*')
        .eq('user_id', user?.id);

      if (permissionsError) throw permissionsError;

      // Fetch access rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('campaign_access_rules')
        .select('*')
        .eq('is_active', true);

      if (rulesError) throw rulesError;

      setUserPermissions(permissionsData || []);
      setAccessRules(rulesData || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPermission = (targetAudience: string, campaignType: string, action: 'view' | 'participate' | 'manage') => {
    // Check if user has specific permissions for this target audience and campaign type
    const userPermission = userPermissions.find(
      p => p.target_audience === targetAudience && p.campaign_type === campaignType
    );

    if (userPermission) {
      switch (action) {
        case 'view':
          return userPermission.can_view;
        case 'participate':
          return userPermission.can_participate;
        case 'manage':
          return userPermission.can_manage;
        default:
          return false;
      }
    }

    // If no specific permission, check access rules based on user tier
    const accessRule = accessRules.find(
      r => r.target_audience === targetAudience && r.campaign_type === campaignType
    );

    if (accessRule && profile) {
      // Get consultant tier from profile (assuming it's stored there or in consultants table)
      const userTier = 'bronze'; // This should be fetched from user's consultant profile
      
      // Check if user tier meets requirement
      const tierHierarchy = ['bronze', 'silver', 'gold', 'vip'];
      const userTierIndex = tierHierarchy.indexOf(userTier);
      const requiredTierIndex = tierHierarchy.indexOf(accessRule.required_user_tier);
      
      if (userTierIndex >= requiredTierIndex) {
        // For access rules, we assume they can view and participate, but not manage
        return action === 'view' || action === 'participate';
      }
    }

    // Default: deny access
    return false;
  };

  const getBudgetLimits = (targetAudience: string, campaignType: string) => {
    // Check user-specific permissions first
    const userPermission = userPermissions.find(
      p => p.target_audience === targetAudience && p.campaign_type === campaignType
    );

    if (userPermission) {
      return {
        min: userPermission.min_budget,
        max: userPermission.max_budget
      };
    }

    // Check access rules
    const accessRule = accessRules.find(
      r => r.target_audience === targetAudience && r.campaign_type === campaignType
    );

    if (accessRule) {
      return {
        min: accessRule.min_budget,
        max: accessRule.max_budget
      };
    }

    return { min: undefined, max: undefined };
  };

  const filterCampaignTargets = (campaignTargets: any[]) => {
    return campaignTargets.filter(target => {
      // Check if user can view any campaign type for this target audience
      return target.campaignTypes?.some((campaignType: string) => 
        checkPermission(target.name, campaignType, 'view')
      );
    }).map(target => ({
      ...target,
      campaignTypes: target.campaignTypes?.filter((campaignType: string) => 
        checkPermission(target.name, campaignType, 'view')
      )
    }));
  };

  const canUserAccessCampaign = (targetAudience: string, campaignType: string) => {
    return checkPermission(targetAudience, campaignType, 'participate');
  };

  return {
    userPermissions,
    accessRules,
    loading,
    checkPermission,
    getBudgetLimits,
    filterCampaignTargets,
    canUserAccessCampaign,
    refreshPermissions: fetchPermissions
  };
};