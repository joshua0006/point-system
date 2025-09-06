import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Target, Phone, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CampaignCard } from "@/components/CampaignCard";

interface ActiveCampaignsProps {
  hideInactiveCampaigns: boolean;
  setHideInactiveCampaigns: (hide: boolean) => void;
}

export const ActiveCampaigns = React.memo(({ hideInactiveCampaigns, setHideInactiveCampaigns }: ActiveCampaignsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Optimized query - only fetch needed fields
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
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaigns:', error);
        return;
      }

      setCampaigns(data || []);
    } catch (error) {
      console.error('Error in fetchCampaigns:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Memoized filtered campaigns
  const filteredCampaigns = useMemo(() => {
    if (!hideInactiveCampaigns) return campaigns;
    
    return campaigns.filter(campaign => 
      campaign.billing_status === 'active' || 
      campaign.billing_status === 'paused' ||
      campaign.billing_status === 'paused_insufficient_funds'
    );
  }, [campaigns, hideInactiveCampaigns]);

  const getCampaignTypeIcon = useCallback((campaignName: string) => {
    if (campaignName.toLowerCase().includes('facebook')) return Target;
    if (campaignName.toLowerCase().includes('cold calling')) return Phone;
    if (campaignName.toLowerCase().includes('va support')) return Users;
    return Target;
  }, []);

  const getCampaignTypeColor = useCallback((campaignName: string) => {
    if (campaignName.toLowerCase().includes('facebook')) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (campaignName.toLowerCase().includes('cold calling')) return 'text-green-600 bg-green-50 border-green-200';
    if (campaignName.toLowerCase().includes('va support')) return 'text-purple-600 bg-purple-50 border-purple-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'paused_insufficient_funds': return 'bg-red-100 text-red-800 border-red-200';
      case 'stopped': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const pauseCampaign = useCallback(async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('campaign_participants')
        .update({ billing_status: 'paused' })
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: "Campaign Paused",
        description: "Your campaign has been paused. You can resume it anytime.",
      });

      fetchCampaigns();
    } catch (error) {
      console.error('Error pausing campaign:', error);
      toast({
        title: "Error",
        description: "Failed to pause campaign. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast, fetchCampaigns]);

  const resumeCampaign = useCallback(async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('campaign_participants')
        .update({ billing_status: 'active' })
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: "Campaign Resumed",
        description: "Your campaign is now active and running.",
      });

      fetchCampaigns();
    } catch (error) {
      console.error('Error resuming campaign:', error);
      toast({
        title: "Error", 
        description: "Failed to resume campaign. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast, fetchCampaigns]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredCampaigns.length === 0) {
    return (
      <Card className="text-center p-12">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Campaigns Yet</h3>
        <p className="text-muted-foreground mb-4">
          {hideInactiveCampaigns 
            ? "No active campaigns found. Try showing all campaigns or launch a new one."
            : "You haven't launched any campaigns yet. Start generating leads today!"
          }
        </p>
        <Button onClick={() => window.location.href = '/campaigns'}>
          Launch Your First Campaign
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">My Active Campaigns</h2>
          <p className="text-sm text-muted-foreground">
            Manage and monitor your lead generation campaigns
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setHideInactiveCampaigns(!hideInactiveCampaigns)}
        >
          {hideInactiveCampaigns ? 'Show All' : 'Active Only'}
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredCampaigns.map((campaign) => {
          const Icon = getCampaignTypeIcon(campaign.lead_gen_campaigns?.name || '');
          const typeColor = getCampaignTypeColor(campaign.lead_gen_campaigns?.name || '');
          const statusColor = getStatusColor(campaign.billing_status);

          return (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              Icon={Icon}
              typeColor={typeColor}
              statusColor={statusColor}
              onPause={pauseCampaign}
              onResume={resumeCampaign}
            />
          );
        })}
      </div>
    </div>
  );
});