import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logger } from "@/utils/logger";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Navigation } from "@/components/Navigation";
import { DollarSign, Target, Phone, Settings, LogOut, Pause, Play, CreditCard, Shield, Users, User, Plus, MoreVertical, ArrowLeft } from "lucide-react";
import { TopUpModal } from "@/components/TopUpModal";
import { CampaignLaunchSuccessModal } from "@/components/campaigns/CampaignLaunchSuccessModal";
import { AdminInterface } from "@/components/campaigns/AdminInterface";
import { FacebookAdsCatalog } from "@/components/campaigns/FacebookAdsCatalog";
import { useToast } from "@/hooks/use-toast";
import { useCampaignTargets } from "@/hooks/useCampaignTargets";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveContainer } from "@/components/ui/mobile-responsive";
import { SuperAdminInterface } from "@/components/campaigns/SuperAdminInterface";

const FacebookAdsCampaigns = () => {
  const { user, signOut, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
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
  const isMobile = useIsMobile();

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
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <ResponsiveContainer>
        <div className={isMobile ? "pt-4" : "pt-8"}>
          <div className={isMobile ? "mb-4" : "mb-6 sm:mb-8"}>
            <div className="flex items-center gap-4 mb-4">
              <Link to="/campaigns">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Campaigns
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className={isMobile ? "text-xl font-bold text-foreground mb-1" : "text-2xl sm:text-3xl font-bold text-foreground mb-1"}>
                  Facebook Ad Campaigns
                </h1>
                <p className={isMobile ? "text-sm text-muted-foreground" : "text-muted-foreground text-sm sm:text-base"}>
                  Launch targeted Facebook advertising campaigns to reach your ideal audience
                </p>
              </div>
            </div>
          </div>

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

      {/* Checkout Modal */}
      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirm Facebook Ads Campaign Launch</DialogTitle>
            <DialogDescription>
              Review your campaign details before launching.
            </DialogDescription>
          </DialogHeader>
          
          <Card className="mb-4">
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">Campaign Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <strong>Method:</strong> {pendingCampaign?.method}
                </div>
                <div>
                  <strong>Budget:</strong> ${pendingCampaign?.budget}
                </div>
                <div>
                  <strong>Consultant:</strong> {profile?.full_name || 'Unknown'}
                </div>
                <div>
                  <strong>Target Audience:</strong> {pendingCampaign?.targetAudience?.name}
                </div>
                <div>
                  <strong>Prorate First Month:</strong> {pendingCampaign?.prorateFirstMonth ? 'Yes' : 'No'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">Payment Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <strong>Current Balance:</strong> {profile?.flexi_credits_balance} points
                </div>
                <div>
                  <strong>Amount to Deduct:</strong> {pendingCampaign?.prorateFirstMonth ? 
                    Math.max(1, Math.round((pendingCampaign?.budget * new Date().getDate()) / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()))
                    : pendingCampaign?.budget} points
                </div>
                <div>
                  <strong>Balance After Deduction:</strong> {profile?.flexi_credits_balance - (pendingCampaign?.prorateFirstMonth ? 
                    Math.max(1, Math.round((pendingCampaign?.budget * new Date().getDate()) / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()))
                    : pendingCampaign?.budget)} points
                </div>
              </div>
            </CardContent>
          </Card>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCheckoutModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={confirmCheckout} className="flex-1">
              <DollarSign className="h-4 w-4 mr-2" />
              Confirm & Launch
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
    </div>
  );
};

export default FacebookAdsCampaigns;
