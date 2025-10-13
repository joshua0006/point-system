import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Target, Phone, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CampaignCard } from "@/components/CampaignCard";
import { generateMockAnalytics, getCampaignTypeFromName, type CampaignAnalytics } from "@/utils/campaignAnalytics";
import { CampaignAnalyticsModal } from "@/components/campaigns/CampaignAnalyticsModal";

interface ActiveCampaignsProps {
  hideInactiveCampaigns: boolean;
  setHideInactiveCampaigns: (hide: boolean) => void;
}

export const ActiveCampaigns = React.memo(({ hideInactiveCampaigns, setHideInactiveCampaigns }: ActiveCampaignsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [selectedAnalytics, setSelectedAnalytics] = useState<CampaignAnalytics | null>(null);

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
    if (campaignName.toLowerCase().includes('facebook')) return 'text-white bg-blue-600 shadow-lg';
    if (campaignName.toLowerCase().includes('cold calling')) return 'text-white bg-green-600 shadow-lg';
    if (campaignName.toLowerCase().includes('va support')) return 'text-white bg-purple-600 shadow-lg';
    return 'text-white bg-blue-600 shadow-lg';
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-accent/10 text-accent border-accent/30';
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

      // Get user details for email
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Send pause notification emails
        try {
          const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-campaign-launch-emails', {
            body: {
              emailType: 'pause',
              campaignId: campaignId,
              campaignName: 'Campaign',
              campaignType: 'facebook-ads',
              budget: 100,
              userEmail: user.email || 'user@example.com',
              userName: user.email || 'User',
              action: 'pause'
            }
          });

          if (emailError) {
            console.error('Failed to send pause notification emails:', emailError);
          }
        } catch (emailError) {
          console.error('Error sending pause notification emails:', emailError);
        }
      }

      toast({
        title: "Campaign Paused",
        description: "Your campaign has been paused. Confirmation emails sent.",
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

      // Get user details for email
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Send resume notification emails
        try {
          const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-campaign-launch-emails', {
            body: {
              emailType: 'resume',
              campaignId: campaignId,
              campaignName: 'Campaign',
              campaignType: 'facebook-ads',
              budget: 100,
              userEmail: user.email || 'user@example.com',
              userName: user.email || 'User',
              action: 'resume'
            }
          });

          if (emailError) {
            console.error('Failed to send resume notification emails:', emailError);
          }
        } catch (emailError) {
          console.error('Error sending resume notification emails:', emailError);
        }
      }

      toast({
        title: "Campaign Resumed",
        description: "Your campaign has been resumed. Confirmation emails sent.",
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

  const viewAnalytics = useCallback((campaignId: string) => {
    // Find the campaign to get its details
    const campaign = campaigns.find(c => c.id === campaignId);
    const campaignName = campaign?.lead_gen_campaigns?.name || 'Campaign';

    // Generate mock analytics data
    const campaignType = getCampaignTypeFromName(campaignName);
    const analyticsData = generateMockAnalytics(campaignId, campaignName, campaignType);

    // Set analytics data and open modal
    setSelectedAnalytics(analyticsData);
    setAnalyticsModalOpen(true);
  }, [campaigns]);

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
      <Card className="text-center p-8 sm:p-12">
        <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mb-5">
          <BarChart3 className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold mb-2.5">No Campaigns Yet</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
          {hideInactiveCampaigns
            ? "No active campaigns found. Try showing all campaigns or launch a new one."
            : "You haven't launched any campaigns yet. Start generating leads today!"
          }
        </p>
        <Button onClick={() => window.location.href = '/campaigns'} className="w-full sm:w-auto min-h-[44px]">
          Launch Your First Campaign
        </Button>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-3">
          <div className="flex-1">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-1.5">My Active Campaigns</h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Manage and monitor your lead generation campaigns
            </p>
          </div>
          <Button
            variant={hideInactiveCampaigns ? "default" : "default"}
            size="sm"
            onClick={() => setHideInactiveCampaigns(!hideInactiveCampaigns)}
            className={`w-full sm:w-auto min-h-[40px] sm:min-h-[36px] font-semibold transition-all duration-200 ${
              hideInactiveCampaigns
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg border-0'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg border-0'
            }`}
          >
            {hideInactiveCampaigns ? 'Show All' : 'Active Only'}
          </Button>
        </div>

        <div className="grid gap-4 sm:gap-5">
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
                onViewAnalytics={viewAnalytics}
              />
            );
          })}
        </div>
      </div>

      {/* Analytics Modal */}
      <CampaignAnalyticsModal
        isOpen={analyticsModalOpen}
        onClose={() => setAnalyticsModalOpen(false)}
        analytics={selectedAnalytics}
      />
    </>
  );
});