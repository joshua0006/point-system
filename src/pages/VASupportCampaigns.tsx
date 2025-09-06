import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Users } from "lucide-react";
import { VASupportPlans } from "@/components/campaigns/VASupportPlans";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveContainer } from "@/components/ui/mobile-responsive";
import { TopUpModal } from "@/components/TopUpModal";
import { CampaignLaunchSuccessModal } from "@/components/campaigns/CampaignLaunchSuccessModal";

const VASupportCampaigns = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successCampaignDetails, setSuccessCampaignDetails] = useState<any>(null);
  const isMobile = useIsMobile();

  const userBalance = profile?.flexi_credits_balance || 0;

  const handleVASupportComplete = async (campaignData: any) => {
    if (!user?.id) return;

    try {
      const { method, plan, consultantName, budget } = campaignData;
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
        description: `Your ${plan?.name} VA support campaign is now active.`,
      });

      console.log('VA support campaign creation completed successfully!');
    } catch (error) {
      console.error('Error in handleVASupportComplete:', error);
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
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className={isMobile ? "text-xl font-bold text-foreground mb-1" : "text-2xl sm:text-3xl font-bold text-foreground mb-1"}>
                  VA Support Campaigns
                </h1>
                <p className={isMobile ? "text-sm text-muted-foreground" : "text-muted-foreground text-sm sm:text-base"}>
                  Professional virtual assistant support for your business needs
                </p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Choose Your VA Support Plan</h3>
              <p className="text-muted-foreground mb-6">
                Professional virtual assistant support to help grow your business
              </p>
            </div>
            
            <div className="grid gap-4 md:gap-6">
              {[
                {
                  key: "basic",
                  name: "Basic VA Support",
                  price: 50,
                  features: [
                    "Follow-up texting only",
                    "You take over after lead responds",
                    "Update CRM & Google Calendar",
                  ]
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
                  ]
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
                  ]
                }
              ].map((plan) => {
                const balanceAfter = userBalance - plan.price;
                const canAfford = balanceAfter >= -1000;
                
                return (
                  <Card key={plan.key} className={`${!canAfford ? 'opacity-60' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-semibold">{plan.name}</h4>
                          <p className="text-2xl font-bold text-primary">{plan.price} points/month</p>
                        </div>
                      </div>
                      
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Button
                        className="w-full"
                        disabled={!canAfford}
                        onClick={() => handleVASupportComplete({
                          method: 'va-support',
                          plan,
                          consultantName: profile?.full_name || '',
                          budget: plan.price
                        })}
                      >
                        {canAfford ? `Launch ${plan.name}` : 'Balance Limit Exceeded'}
                      </Button>
                      
                      {!canAfford && (
                        <p className="text-xs text-destructive mt-2 text-center">
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

export default VASupportCampaigns;