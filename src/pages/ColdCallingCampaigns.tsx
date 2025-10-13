import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Wallet, Phone, Zap } from "lucide-react";
import { ColdCallingWizard } from "@/components/campaigns/ColdCallingWizard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveContainer } from "@/components/ui/mobile-responsive";
import { TopUpModal } from "@/components/TopUpModal";
import { CampaignLaunchSuccessModal } from "@/components/campaigns/CampaignLaunchSuccessModal";
import { WalletBalanceCard } from "@/components/wallet/WalletBalanceCard";

const ColdCallingCampaigns = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successCampaignDetails, setSuccessCampaignDetails] = useState<any>(null);
  const isMobile = useIsMobile();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const userBalance = profile?.flexi_credits_balance || 0;

  const handleColdCallingComplete = async (campaignData: any) => {
    if (!user?.id) return;

    try {
      const { method, hours, budget } = campaignData;
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

      // Show success modal
      setSuccessCampaignDetails({
        ...campaignData,
        campaignId: campaignData_db.id,
        amountDeducted: amountToDeduct,
        newBalance: userBalance - amountToDeduct
      });
      
      setShowSuccessModal(true);
      
      // Refresh data
      await refreshProfile();

      toast({
        title: "Campaign Launched Successfully!",
        description: `Your ${hours}h/month cold calling campaign is now active.`,
      });

      console.log('Cold calling campaign creation completed successfully!');
    } catch (error) {
      console.error('Error in handleColdCallingComplete:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
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

          {/* Wallet Balance Card */}
          <WalletBalanceCard
            balance={profile?.flexi_credits_balance || 0}
            isMobile={isMobile}
            onTopUpClick={() => setTopUpModalOpen(true)}
            className={isMobile ? "mb-10" : "mb-16"}
          />

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