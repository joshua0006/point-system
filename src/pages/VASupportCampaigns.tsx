import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CreditCard, Wallet, TrendingUp, Check, MessageSquare, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveContainer } from "@/components/ui/mobile-responsive";
import { TopUpModal } from "@/components/TopUpModal";
import { CampaignLaunchSuccessModal } from "@/components/campaigns/CampaignLaunchSuccessModal";

const VASupportCampaigns = () => {
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

  const handleVASupportComplete = (campaignData: any) => {
    console.log('VA support campaign data received:', campaignData);
    setPendingCampaign(campaignData);
    setShowCheckoutModal(true);
  };

  const confirmCheckout = async () => {
    if (!pendingCampaign || !user?.id) return;

    setIsLaunching(true);
    try {
      const { method, plan, consultantName, budget } = pendingCampaign;
      const amountToDeduct = budget;

      console.log('Starting VA support campaign creation...');
      console.log('Plan:', plan, 'Budget:', budget, 'Amount to deduct:', amountToDeduct, 'User Balance:', userBalance);

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
          description: `VA support campaign launch - ${plan?.name} - ${amountToDeduct} points`
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
          name: `VA Support Campaign - ${plan?.name}`,
          description: `Virtual assistant support campaign with ${plan?.name} plan`,
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
          consultant_name: consultantName || profile?.full_name || 'Unknown',
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
            campaignType: 'va-support',
            targetAudience: 'General',
            budget: budget,
            consultantName: consultantName || profile?.full_name || user.email,
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
        description: `Your ${plan?.name} VA support campaign is now active.`,
      });

      console.log('VA support campaign creation completed successfully!');
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
    <SidebarLayout title="VA Support Campaigns" description="Professional virtual assistant support for your business needs">
      <ResponsiveContainer>
        <div className={isMobile ? "pt-2" : "pt-4"}>
          {/* Hero Section - Accessibility Enhanced */}
          <header
            className={`${isMobile ? "mb-8" : "mb-12"} text-center`}
            role="banner"
            aria-labelledby="va-support-heading"
          >
            <Badge
              variant="secondary"
              className="inline-flex items-center gap-2 mb-3 px-4 py-2"
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              <span>VA Support Campaigns</span>
            </Badge>
            <h1
              id="va-support-heading"
              className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold mb-3 text-primary`}
            >
              Virtual Assistant Support Services
            </h1>
            <p className={`${isMobile ? "text-sm" : "text-base"} text-muted-foreground max-w-2xl mx-auto`}>
              Professional VA support with managed follow-ups, appointment setting, and CRM updates to free your time for selling
            </p>
          </header>

          {/* VA Support Plans */}
          <div className="w-full max-w-6xl mx-auto space-y-8">
            <div className="text-center">
              <h3 className="text-2xl md:text-3xl font-semibold mb-3">Choose Your VA Support Plan</h3>
              <p className="text-muted-foreground text-base mb-8">
                Professional virtual assistant support to help grow your business
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  key: "basic",
                  name: "Basic VA Support",
                  price: 50,
                  features: [
                    "Follow-up texting only",
                    "You take over after lead responds",
                    "Update CRM & Google Calendar",
                  ],
                  highlight: false
                },
                {
                  key: "standard",
                  name: "Standard VA Support",
                  price: 75,
                  features: [
                    "Follow-up texting",
                    "Appointment setting",
                    "Update CRM & Google Calendar",
                    "Basic lead qualification"
                  ],
                  highlight: true
                },
                {
                  key: "premium",
                  name: "Premium VA Support",
                  price: 100,
                  features: [
                    "Follow-up texting",
                    "Appointment setting",
                    "Full lead qualification",
                    "Update CRM & Google Calendar",
                    "Custom scripts & workflows"
                  ],
                  highlight: false
                }
              ].map((plan) => {
                const balanceAfter = userBalance - plan.price;
                const canAfford = balanceAfter >= -1000;

                return (
                  <Card
                    key={plan.key}
                    className={`relative border-2 transition-all duration-300 ${
                      canAfford ? 'hover:scale-105' : ''
                    } ${
                      plan.highlight && canAfford
                        ? 'border-primary shadow-lg shadow-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 scale-105'
                        : 'border-border hover:border-primary/50 shadow-lg shadow-primary/10 hover:shadow-2xl hover:shadow-primary/20'
                    } ${!canAfford ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <CardContent className="p-8 flex flex-col h-full text-center">
                      {plan.highlight && canAfford && (
                        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary shadow-md" variant="default">
                          Most Popular
                        </Badge>
                      )}

                      {/* Icon */}
                      <div className="flex justify-center mb-4">
                        <div className={`p-4 rounded-xl ${
                          plan.highlight && canAfford
                            ? 'bg-primary shadow-lg'
                            : 'bg-primary/10'
                        }`}>
                          <MessageSquare className={`h-6 w-6 ${
                            plan.highlight && canAfford ? 'text-white' : 'text-primary'
                          }`} />
                        </div>
                      </div>

                      {/* Plan Name */}
                      <h4 className="text-xl font-semibold mb-4">{plan.name}</h4>

                      {/* Price */}
                      <div className="mb-6">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                          <span className="text-sm text-muted-foreground">points</span>
                        </div>
                        <span className="text-sm text-muted-foreground">/month</span>
                      </div>

                      {/* Features */}
                      <ul className="space-y-3 mb-8 flex-grow">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm">
                            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-left">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA Button */}
                      <Button
                        onClick={() => handleVASupportComplete({
                          method: 'va-support',
                          plan,
                          consultantName: profile?.full_name || '',
                          budget: plan.price
                        })}
                        disabled={!canAfford}
                        className={`w-full py-6 text-base font-semibold ${
                          plan.highlight && canAfford
                            ? 'bg-primary hover:bg-blue-600 hover:text-white shadow-lg hover:shadow-xl'
                            : 'text-primary hover:bg-blue-600 hover:text-white hover:border-blue-600'
                        }`}
                        variant={plan.highlight && canAfford ? "default" : "outline"}
                        size="lg"
                      >
                        {canAfford ? 'Launch Campaign' : 'Balance Limit Exceeded'}
                      </Button>

                      {/* Balance Warning */}
                      {!canAfford && (
                        <p className="text-xs text-destructive mt-3">
                          Would bring balance to {balanceAfter} points (minimum: -1000)
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
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
                <strong>VA Support</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <strong>{pendingCampaign?.plan?.name}</strong>
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

export default VASupportCampaigns;