import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BarChart3, Target, Phone, Users, Filter } from "lucide-react";
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
  const [processingCampaignId, setProcessingCampaignId] = useState<string | null>(null);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [selectedAnalytics, setSelectedAnalytics] = useState<CampaignAnalytics | null>(null);
  const [unsubscribeDialogOpen, setUnsubscribeDialogOpen] = useState(false);
  const [campaignToUnsubscribe, setCampaignToUnsubscribe] = useState<{ id: string; name: string } | null>(null);

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

  // Real-time subscription for campaign updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('active-campaigns-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_participants',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[ActiveCampaigns] Real-time update:', payload);
          // Refetch campaigns when any change occurs
          fetchCampaigns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchCampaigns]);

  // Memoized filtered campaigns
  const filteredCampaigns = useMemo(() => {
    if (!hideInactiveCampaigns) return campaigns;

    return campaigns.filter(campaign =>
      campaign.billing_status === 'active' ||
      campaign.billing_status === 'paused' ||
      campaign.billing_status === 'paused_insufficient_funds' ||
      campaign.billing_status === 'stopped'
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
      case 'stopped': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const pauseCampaign = useCallback(async (campaignId: string) => {
    try {
      setProcessingCampaignId(campaignId);

      const { error } = await supabase
        .from('campaign_participants')
        .update({ billing_status: 'paused' })
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: "Campaign Paused",
        description: "Your campaign has been paused.",
      });

      fetchCampaigns();
    } catch (error) {
      console.error('Error pausing campaign:', error);
      toast({
        title: "Error",
        description: "Failed to pause campaign. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingCampaignId(null);
    }
  }, [toast, fetchCampaigns]);

  const resumeCampaign = useCallback(async (campaignId: string) => {
    try {
      setProcessingCampaignId(campaignId);

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
    } finally {
      setProcessingCampaignId(null);
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

  const handleUnsubscribeClick = useCallback((campaignId: string) => {
    // Find the campaign to get its name for the confirmation dialog
    const campaign = campaigns.find(c => c.id === campaignId);
    const campaignName = campaign?.lead_gen_campaigns?.name || 'Campaign';

    setCampaignToUnsubscribe({ id: campaignId, name: campaignName });
    setUnsubscribeDialogOpen(true);
  }, [campaigns]);

  const confirmUnsubscribe = useCallback(async () => {
    if (!campaignToUnsubscribe) return;

    try {
      setProcessingCampaignId(campaignToUnsubscribe.id);
      setUnsubscribeDialogOpen(false);

      // Get campaign details to show next billing date
      const campaign = campaigns.find(c => c.id === campaignToUnsubscribe.id);
      const nextBillingDate = campaign?.next_billing_date
        ? new Date(campaign.next_billing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'the end of your billing period';

      const { error } = await supabase
        .from('campaign_participants')
        .update({
          billing_status: 'stopped',
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignToUnsubscribe.id);

      if (error) throw error;

      toast({
        title: "Unsubscribed Successfully",
        description: `You will continue to receive leads until ${nextBillingDate}. No further charges will be made.`,
      });

      fetchCampaigns();
    } catch (error) {
      console.error('Error unsubscribing from campaign:', error);
      toast({
        title: "Error",
        description: "Failed to unsubscribe from campaign. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingCampaignId(null);
      setCampaignToUnsubscribe(null);
    }
  }, [campaignToUnsubscribe, campaigns, toast, fetchCampaigns]);

  const resubscribeCampaign = useCallback(async (campaignId: string) => {
    try {
      setProcessingCampaignId(campaignId);

      const { error } = await supabase
        .from('campaign_participants')
        .update({
          billing_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: "Subscribed Successfully",
        description: "You have resubscribed to the campaign. Regular billing will resume.",
      });

      fetchCampaigns();
    } catch (error) {
      console.error('Error resubscribing to campaign:', error);
      toast({
        title: "Error",
        description: "Failed to resubscribe to campaign. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingCampaignId(null);
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

          {/* Filter Controls */}
          <div className="inline-flex rounded-lg bg-muted p-1 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHideInactiveCampaigns(true)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-md transition-all duration-200 ${
                  hideInactiveCampaigns
                    ? 'bg-white text-primary shadow-sm font-semibold pointer-events-none'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                }`}
              >
                Active Only
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHideInactiveCampaigns(false)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-md transition-all duration-200 ${
                  !hideInactiveCampaigns
                    ? 'bg-white text-primary shadow-sm font-semibold pointer-events-none'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                }`}
              >
                Show All
              </Button>
            </div>
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
                onUnsubscribe={handleUnsubscribeClick}
                onResubscribe={resubscribeCampaign}
                isProcessing={processingCampaignId === campaign.id}
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

      {/* Unsubscribe Confirmation Dialog */}
      <AlertDialog open={unsubscribeDialogOpen} onOpenChange={setUnsubscribeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsubscribe from Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unsubscribe from <strong>{campaignToUnsubscribe?.name}</strong>?
              {' '}You will continue to receive leads until your next billing date, but no further charges will be made after that.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnsubscribe}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Unsubscribe
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});