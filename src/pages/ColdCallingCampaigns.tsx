import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CreditCard, Wallet, Phone, Zap, Loader2 } from "lucide-react";
import { ColdCallingWizard } from "@/components/campaigns/ColdCallingWizard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveContainer } from "@/components/ui/mobile-responsive";
import { TopUpModal } from "@/components/TopUpModal";
import { CampaignLaunchSuccessModal } from "@/components/campaigns/CampaignLaunchSuccessModal";

const ColdCallingCampaigns = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successCampaignDetails, setSuccessCampaignDetails] = useState<any>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [pendingCampaign, setPendingCampaign] = useState<any>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const isMobile = useIsMobile();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const userBalance = profile?.flexi_credits_balance || 0;

  const handleColdCallingComplete = (campaignData: any) => {
    console.log('Cold calling campaign data received:', campaignData);
    setPendingCampaign(campaignData);
    setShowCheckoutModal(true);
  };

  const confirmCheckout = async () => {
    if (!pendingCampaign || !user?.id) return;

    setIsLaunching(true);
    try {
      const { method, hours, budget } = pendingCampaign;
      const amountToDeduct = budget;

      console.log('Starting cold calling campaign creation...');
      console.log('Budget:', budget, 'Amount to deduct:', amountToDeduct, 'User Balance:', userBalance);

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
          description: `Cold calling campaign launch - ${hours}h/month - ${amountToDeduct} points`
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
      const { data: campaignData_db, error: campaignError } = await supabase
        .from('lead_gen_campaigns')
        .insert({
          name: `Cold Calling Campaign - ${hours}h/month`,
          description: `Professional cold calling campaign with ${hours} hours per month`,
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
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      nextBillingDate.setDate(1);

      const { error: participantError } = await supabase
        .from('campaign_participants')
        .insert({
          campaign_id: campaignData_db.id,
          user_id: user.id,
          budget_contribution: budget,
          consultant_name: profile?.full_name || 'Unknown',
          next_billing_date: nextBillingDate.toISOString().split('T')[0],
          last_billed_date: new Date().toISOString().split('T')[0],
          billing_status: 'active',
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
            campaignId: campaignData_db.id,
            campaignName: campaignData_db.name,
            campaignType: 'cold-calling',
            targetAudience: 'General',
            budget: budget,
            consultantName: profile?.full_name || user.email,
            hours: pendingCampaign?.hours,
            userEmail: user.email,
            userName: profile?.full_name || user.email?.split('@')[0] || 'User'
          }
        });
        console.log('Campaign launch emails sent successfully');
      } catch (emailError) {
        // Log error but don't block campaign launch
        console.error('Failed to send campaign launch emails:', emailError);
      }

      // Show success modal
      setSuccessCampaignDetails({
        ...pendingCampaign,
        campaignId: campaignData_db.id,
        amountDeducted: amountToDeduct,
        newBalance: userBalance - amountToDeduct
      });

      setShowSuccessModal(true);
      setShowCheckoutModal(false);
      setPendingCampaign(null);

      // Refresh data
      await refreshProfile();

      toast({
        title: "Campaign Launched Successfully!",
        description: `Your ${hours}h/month cold calling campaign is now active.`,
      });

      console.log('Cold calling campaign creation completed successfully!');
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

  const handleTopUpSuccess = (points: number) => {
    refreshProfile();
    toast({
      title: "Top-up Successful! 🎉",
      description: `${points} points added to your account.`
    });
  };

  return (
    <SidebarLayout title="Cold Calling Campaigns" description="Professional cold calling services with trained telemarketers">
      <ResponsiveContainer>
        <div className={isMobile ? "pt-2" : "pt-4"}>
          {/* Hero Section - Accessibility Enhanced */}
          <header
            className={`${isMobile ? "mb-8" : "mb-12"} text-center`}
            role="banner"
            aria-labelledby="cold-calling-heading"
          >
            <Badge
              variant="secondary"
              className="inline-flex items-center gap-2 mb-3 px-4 py-2"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span>Cold Calling Campaigns</span>
            </Badge>
            <h1
              id="cold-calling-heading"
              className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold mb-3 text-primary`}
            >
              Professional Cold Calling Services
            </h1>
            <p className={`${isMobile ? "text-sm" : "text-base"} text-muted-foreground max-w-2xl mx-auto`}>
              Hire trained telemarketers at 6 points per hour to generate quality leads through direct outreach
            </p>
          </header>

          {/* Campaign Wizard */}
          <div className="max-w-7xl mx-auto">
            <ColdCallingWizard
              onComplete={handleColdCallingComplete}
              onBack={() => navigate('/campaigns/launch')}
              userBalance={userBalance}
            />
          </div>
        </div>
      </ResponsiveContainer>

      {/* Checkout Modal */}
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
                <span className="text-muted-foreground">Campaign Type</span>
                <strong>Cold Calling</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hours per Month</span>
                <strong>{pendingCampaign?.hours}h</strong>
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
                  -{pendingCampaign?.budget?.toLocaleString()} points
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
                  (profile?.flexi_credits_balance || 0) - (pendingCampaign?.budget || 0) < 0
                    ? 'text-destructive'
                    : ''
                }`}>
                  {((profile?.flexi_credits_balance || 0) - (pendingCampaign?.budget || 0))?.toLocaleString()} points
                </strong>
              </div>
            </div>

            {/* Negative Balance Warning */}
            {(profile?.flexi_credits_balance || 0) - (pendingCampaign?.budget || 0) < 0 && (
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
              aria-label={`Confirm and launch campaign. This will deduct ${pendingCampaign?.budget} points from your account`}
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
        onSuccess={handleTopUpSuccess}
      />
    </SidebarLayout>
  );
};

export default ColdCallingCampaigns;