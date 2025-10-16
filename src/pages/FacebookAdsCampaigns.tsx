import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { logger } from "@/utils/logger";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { DollarSign, Target, Phone, Settings, LogOut, Pause, Play, CreditCard, Shield, Users, User, Plus, MoreVertical, Loader2 } from "lucide-react";
import { TopUpModal } from "@/components/TopUpModal";
import { CampaignLaunchSuccessModal } from "@/components/campaigns/CampaignLaunchSuccessModal";
import { AdminInterface } from "@/components/campaigns/AdminInterface";
import { FacebookAdsCatalog } from "@/components/campaigns/FacebookAdsCatalog";
import { useToast } from "@/hooks/use-toast";
import { useCampaignTargets } from "@/hooks/useCampaignTargets";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveContainer } from "@/components/ui/mobile-responsive";
import { SuperAdminInterface } from "@/components/campaigns/SuperAdminInterface";

const FacebookAdsCampaigns = () => {
  const { user, signOut, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const { campaignTargets, setCampaignTargets, refreshTargets } = useCampaignTargets();
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [pendingCampaign, setPendingCampaign] = useState<any>(null);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [userCampaigns, setUserCampaigns] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successCampaignDetails, setSuccessCampaignDetails] = useState<any>(null);
  const [hideInactiveCampaigns, setHideInactiveCampaigns] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [editingTarget, setEditingTarget] = useState<any>(null);
  const [showTargetDialog, setShowTargetDialog] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const isMobile = useIsMobile();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    checkAdminStatus();
    fetchUserCampaigns();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user?.id) {
      console.log('No user found');
      return;
    }

    try {
      console.log('Checking admin status for user:', user.id, user.email);
      
      if (profile?.role === 'admin') {
        console.log('Profile from context:', profile);
        console.log('Using profile from context, role:', profile.role);
        setIsAdmin(true);
        console.log('User is admin (from context), setting isAdmin to true');
        return;
      }

      const { data, error } = await supabase.rpc('get_user_role', {
        check_user_id: user.id
      });

      if (error) {
        console.error('Error checking admin status:', error);
        return;
      }

      const isUserAdmin = data === 'admin';
      logger.log('Admin check result:', { data, isUserAdmin });
      setIsAdmin(isUserAdmin);
    } catch (error) {
      console.error('Error in checkAdminStatus:', error);
    }
  };

  const fetchUserCampaigns = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('campaign_participants')
        .select(`
          *,
          lead_gen_campaigns (*)
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user campaigns:', error);
        return;
      }

      setUserCampaigns(data || []);
    } catch (error) {
      console.error('Error in fetchUserCampaigns:', error);
    }
  };

  const pauseCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('lead_gen_campaigns')
        .update({ status: 'paused' })
        .eq('id', campaignId);

      if (error) {
        console.error('Error pausing campaign:', error);
        toast({
          title: "Error",
          description: `Failed to pause campaign: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      // Refresh campaigns
      await fetchUserCampaigns();

      toast({
        title: "Campaign Paused",
        description: "The campaign has been successfully paused.",
      });
    } catch (error) {
      console.error('Error in pauseCampaign:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const resumeCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('lead_gen_campaigns')
        .update({ status: 'active' })
        .eq('id', campaignId);

      if (error) {
        console.error('Error resuming campaign:', error);
        toast({
          title: "Error",
          description: `Failed to resume campaign: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      // Refresh campaigns
      await fetchUserCampaigns();

      toast({
        title: "Campaign Resumed",
        description: "The campaign has been successfully resumed.",
      });
    } catch (error) {
      console.error('Error in resumeCampaign:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const stopCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('lead_gen_campaigns')
        .update({ status: 'stopped' })
        .eq('id', campaignId);

      if (error) {
        console.error('Error stopping campaign:', error);
        toast({
          title: "Error",
          description: `Failed to stop campaign: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      // Refresh campaigns
      await fetchUserCampaigns();

      toast({
        title: "Campaign Stopped",
        description: "The campaign has been successfully stopped.",
      });
    } catch (error) {
      console.error('Error in stopCampaign:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const confirmCampaignDeletion = async (campaignId: string) => {
    if (!window.confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) {
      return;
    }

    try {
      // Delete campaign participants
      const { error: participantError } = await supabase
        .from('campaign_participants')
        .delete()
        .eq('campaign_id', campaignId);

      if (participantError) {
        console.error('Error deleting campaign participants:', participantError);
        toast({
          title: "Error",
          description: `Failed to delete campaign participants: ${participantError.message}`,
          variant: "destructive"
        });
        return;
      }

      // Delete the lead gen campaign
      const { error: campaignError } = await supabase
        .from('lead_gen_campaigns')
        .delete()
        .eq('id', campaignId);

      if (campaignError) {
        console.error('Error deleting campaign:', campaignError);
        toast({
          title: "Error",
          description: `Failed to delete campaign: ${campaignError.message}`,
          variant: "destructive"
        });
        return;
      }

      // Refresh campaigns
      await fetchUserCampaigns();

      toast({
        title: "Campaign Deleted",
        description: "The campaign has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error in confirmCampaignDeletion:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleHideInactiveCampaigns = () => {
    setHideInactiveCampaigns(!hideInactiveCampaigns);
  };

  const filteredCampaigns = userCampaigns.filter(campaign => {
    if (hideInactiveCampaigns) {
      return campaign.lead_gen_campaigns?.status === 'active' || campaign.lead_gen_campaigns?.status === 'paused';
    }
    return true;
  });

  const userBalance = profile?.flexi_credits_balance || 0;

  const handleFacebookAdsComplete = (campaignData: any) => {
    console.log('Facebook Ads campaign data received:', campaignData);
    setPendingCampaign(campaignData);
    setShowCheckoutModal(true);
  };

  const confirmCheckout = async () => {
    if (!pendingCampaign || !user?.id) return;

    setIsLaunching(true);
    try {
      const { method, budget, targetAudience } = pendingCampaign;
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const day = now.getDate();
      const remainingDays = daysInMonth - day + 1;
      const proratedAmount = Math.max(1, Math.round((budget * remainingDays) / daysInMonth));
      const isProrated = !!pendingCampaign.prorateFirstMonth;
      const amountToDeduct = isProrated ? proratedAmount : budget;

      logger.log('Starting campaign creation process...');
      logger.log('Budget (monthly):', budget, 'Amount to deduct (now):', amountToDeduct, 'User Balance:', userBalance);
      logger.log('Pending Campaign:', pendingCampaign);

      // Check if balance would go below -1000 limit
      const balanceAfterDeduction = userBalance - amountToDeduct;
      if (balanceAfterDeduction < -1000) {
        toast({
          title: "Balance Limit Exceeded", 
          description: `This transaction would bring your balance to ${balanceAfterDeduction} points. The minimum allowed balance is -1000 points.`,
          variant: "destructive"
        });
        return;
      }

      // Deduct points and create transaction
      console.log('Updating user balance...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ flexi_credits_balance: userBalance - amountToDeduct })
        .eq('user_id', user.id);
      if (updateError) {
        console.error('Error updating balance:', updateError);
        toast({
          title: "Error",
          description: `Failed to update balance: ${updateError.message}`,
          variant: "destructive"
        });
        return;
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('flexi_credits_transactions')
        .insert({
          user_id: user.id,
          type: 'purchase',
          amount: -amountToDeduct,
          description: `Facebook Ads campaign launch - ${amountToDeduct} points`
        });

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        toast({
          title: "Warning",
          description: "Campaign launched but transaction record failed to create.",
          variant: "destructive"
        });
      }

      // Create campaign
      console.log('Creating lead gen campaign...');
      const { data: campaignData, error: campaignError } = await supabase
        .from('lead_gen_campaigns')
        .insert({
          name: `Facebook Ads - ${targetAudience?.name || 'General'} Campaign`,
          description: `Targeted Facebook advertising campaign for ${targetAudience?.name || 'general audience'}`,
          total_budget: budget,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: user.id,
          status: 'active'
        })
        .select()
        .single();

      if (campaignError) {
        console.error('Error creating campaign:', campaignError);
        toast({
          title: "Error",
          description: `Failed to create campaign: ${campaignError.message}`,
          variant: "destructive"
        });
        return;
      }

      // Create participant record
      console.log('Creating participant record...');
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      nextBillingDate.setDate(1);

      const { error: participantError } = await supabase
        .from('campaign_participants')
        .insert({
          campaign_id: campaignData.id,
          user_id: user.id,
          budget_contribution: budget,
          consultant_name: profile?.full_name || 'Unknown',
          next_billing_date: nextBillingDate.toISOString().split('T')[0],
          last_billed_date: new Date().toISOString().split('T')[0],
          billing_status: 'active',
          proration_enabled: isProrated,
          monthly_budget: budget
        });

      if (participantError) {
        console.error('Error creating participant:', participantError);
        toast({
          title: "Error",
          description: `Failed to join campaign: ${participantError.message}`,
          variant: "destructive"
        });
        return;
      }

      // Send campaign launch notification emails
      try {
        console.log('Sending campaign launch emails...');
        await supabase.functions.invoke('send-campaign-launch-emails', {
          body: {
            campaignId: campaignData.id,
            campaignName: campaignData.name,
            campaignType: 'facebook-ads',
            targetAudience: targetAudience?.name || 'General Audience',
            budget: budget,
            consultantName: profile?.full_name || user.email,
            userEmail: user.email,
            userName: profile?.full_name || user.email?.split('@')[0] || 'User'
          }
        });
        console.log('Campaign launch emails sent successfully');
      } catch (emailError) {
        // Log error but don't block campaign launch
        console.error('Failed to send campaign launch emails:', emailError);
      }

      console.log('Campaign creation completed successfully!');

      // Show success modal
      setSuccessCampaignDetails({
        ...pendingCampaign,
        campaignId: campaignData.id,
        amountDeducted: amountToDeduct,
        newBalance: userBalance - amountToDeduct
      });
      
      setShowSuccessModal(true);
      setShowCheckoutModal(false);
      setPendingCampaign(null);
      
      // Refresh data
      await refreshProfile();
      await fetchUserCampaigns();

      console.log('All updates completed successfully!');
    } catch (error) {
      console.error('Error in confirmCheckout:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <SidebarLayout title="Facebook Ad Campaigns" description="Launch targeted Facebook advertising campaigns to reach your ideal audience">
      <ResponsiveContainer>
        <div className={isMobile ? "pt-2" : "pt-4"}>
          {/* Hero Section - Accessibility Enhanced */}
          <header
            className={`${isMobile ? "mb-8" : "mb-12"} text-center`}
            role="banner"
            aria-labelledby="facebook-ads-heading"
          >
            <Badge
              variant="secondary"
              className="inline-flex items-center gap-2 mb-4 px-4 py-2"
            >
              <Target className="h-4 w-4" aria-hidden="true" />
              <span>Facebook Advertising</span>
            </Badge>
            <h1
              id="facebook-ads-heading"
              className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold mb-3 text-primary`}
            >
              Launch Facebook Ad Campaigns
            </h1>
            <p className={`${isMobile ? "text-sm" : "text-base"} text-muted-foreground max-w-2xl mx-auto`}>
              Reach your ideal audience with targeted Facebook advertising campaigns
            </p>
          </header>

          {isAdmin && (
            <SuperAdminInterface />
          )}

          <FacebookAdsCatalog
            onComplete={handleFacebookAdsComplete}
            onBack={() => window.history.back()}
            userBalance={userBalance}
            campaignTargets={campaignTargets}
          />
        </div>
      </ResponsiveContainer>

      {/* Checkout Modal - Simple & Minimal */}
      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent
          className="max-w-md"
          aria-describedby="campaign-confirmation-description"
        >
          <DialogHeader>
            <DialogTitle>Confirm Campaign Launch</DialogTitle>
            <DialogDescription id="campaign-confirmation-description">
              Review the details before confirming.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Campaign Details */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target Audience</span>
                <strong>{pendingCampaign?.targetAudience?.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Budget</span>
                <strong>{pendingCampaign?.budget} points</strong>
              </div>
            </div>

            {/* Payment Calculation */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Balance</span>
                <span className="tabular-nums">{profile?.flexi_credits_balance?.toLocaleString()} points</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deduct Now</span>
                <span className="tabular-nums text-destructive">
                  -{(pendingCampaign?.prorateFirstMonth ?
                    Math.max(1, Math.round((pendingCampaign?.budget * (new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate() + 1)) / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()))
                    : pendingCampaign?.budget)?.toLocaleString()} points
                </span>
              </div>
              <div
                className="flex justify-between pt-3 border-t"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <span className="font-medium">New Balance</span>
                <strong className={`tabular-nums ${
                  (profile?.flexi_credits_balance || 0) - (pendingCampaign?.prorateFirstMonth ?
                    Math.max(1, Math.round((pendingCampaign?.budget * (new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate() + 1)) / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()))
                    : pendingCampaign?.budget || 0) < 0
                    ? 'text-destructive'
                    : ''
                }`}>
                  {((profile?.flexi_credits_balance || 0) - (pendingCampaign?.prorateFirstMonth ?
                    Math.max(1, Math.round((pendingCampaign?.budget * (new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate() + 1)) / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()))
                    : pendingCampaign?.budget || 0))?.toLocaleString()} points
                </strong>
              </div>
            </div>

            {/* Proration Notice */}
            {pendingCampaign?.prorateFirstMonth && (
              <p className="text-sm text-muted-foreground">
                First payment prorated for remaining days this month
              </p>
            )}

            {/* Negative Balance Warning */}
            {(profile?.flexi_credits_balance || 0) - (pendingCampaign?.prorateFirstMonth ?
              Math.max(1, Math.round((pendingCampaign?.budget * (new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate() + 1)) / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()))
              : pendingCampaign?.budget || 0) < 0 && (
              <p className="text-sm text-destructive" role="alert">
                Your balance will be negative (minimum allowed: -1000)
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowCheckoutModal(false)}
              className="w-full sm:w-auto"
              aria-label="Cancel campaign launch"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmCheckout}
              className="w-full sm:w-auto"
              disabled={isLaunching}
              aria-label={`Confirm and launch campaign. This will deduct ${pendingCampaign?.prorateFirstMonth ?
                Math.max(1, Math.round((pendingCampaign?.budget * (new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate() + 1)) / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()))
                : pendingCampaign?.budget} points from your account`}
            >
              {isLaunching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLaunching ? "Launching..." : "Confirm & Launch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      {showSuccessModal && (
        <CampaignLaunchSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          campaignDetails={successCampaignDetails}
        />
      )}

      {/* Top Up Modal */}
      <TopUpModal
        isOpen={topUpModalOpen}
        onClose={() => setTopUpModalOpen(false)}
        onSuccess={refreshProfile}
      />
    </SidebarLayout>
  );
};

export default FacebookAdsCampaigns;
