import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveContainer } from '@/components/ui/mobile-responsive';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowRight, Target, Phone, Users, CreditCard, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TopUpModal } from '@/components/TopUpModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { Skeleton } from '@/components/ui/skeleton';

// Import components normally for now - they export named exports, not default
import { CampaignLaunchSuccessModal } from '@/components/campaigns/CampaignLaunchSuccessModal';
import { CampaignMethodSelector } from '@/components/campaigns/CampaignMethodSelector';
import { FacebookAdsCatalog } from '@/components/campaigns/FacebookAdsCatalog';
import { ColdCallingWizard } from '@/components/campaigns/ColdCallingWizard';
import { VASupportPlans } from '@/components/campaigns/VASupportPlans';

const CampaignLaunch = React.memo(() => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [currentFlow, setCurrentFlow] = useState<'method-selection' | 'facebook-ads' | 'cold-calling' | 'va-support'>('method-selection');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [pendingCampaign, setPendingCampaign] = useState<any>(null);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successCampaignDetails, setSuccessCampaignDetails] = useState<any>(null);

  useEffect(() => {
    handleURLParameters();
  }, []);

  const handleURLParameters = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const topupStatus = urlParams.get('topup');
    const points = urlParams.get('points');
    if (topupStatus === 'success' && points) {
      toast({
        title: "Payment Successful!",
        description: `${points} points have been added to your account.`
      });
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      setTimeout(() => {
        refreshProfile();
      }, 1000);
    }

    const vaStatus = urlParams.get('va_subscribe');
    if (vaStatus === 'success') {
      toast({
        title: "Subscribed successfully",
        description: "Your VA Support subscription is now active in Stripe."
      });
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } else if (vaStatus === 'canceled') {
      toast({
        title: "Checkout canceled",
        description: "You canceled the VA Support subscription checkout.",
        variant: "destructive"
      });
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  };

  const handleTopUpSuccess = (points: number) => {
    refreshProfile();
    toast({
      title: "Top-up Successful! 🎉",
      description: `${points} points added to your account.`
    });
  };

  const handleMethodSelect = (method: 'facebook-ads' | 'cold-calling' | 'va-support') => {
    setCurrentFlow(method);
  };

  const handleBackToMethods = () => {
    setCurrentFlow('method-selection');
  };

  const handleCampaignComplete = (campaignData: any) => {
    setPendingCampaign(campaignData);
    setShowCheckoutModal(true);
  };

  const handleVASubscribe = (plan: { key: string; name: string; price: number }) => {
    setPendingCampaign({
      method: 'va-support',
      budget: plan.price,
      campaignType: plan.name,
      consultantName: 'VA Team',
      prorateFirstMonth: true,
    });
    setShowCheckoutModal(true);
  };

  const confirmCheckout = async () => {
    if (!user || !pendingCampaign) return;
    try {
      const budget = pendingCampaign.budget;
      const userBalance = profile?.flexi_credits_balance || 0;

      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const day = now.getDate();
      const remainingDays = daysInMonth - day + 1;
      const proratedAmount = Math.max(1, Math.round((budget * remainingDays) / daysInMonth));
      const isProrated = !!pendingCampaign.prorateFirstMonth;
      const amountToDeduct = isProrated ? proratedAmount : budget;

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
        toast({
          title: "Error",
          description: `Failed to update balance: ${updateError.message}`,
          variant: "destructive"
        });
        return;
      }

      const { error: transactionError } = await supabase.from('flexi_credits_transactions').insert({
        user_id: user.id,
        amount: -amountToDeduct,
        type: 'purchase',
        description: `${pendingCampaign.method === 'facebook-ads' ? 'Facebook Ads' : pendingCampaign.method === 'cold-calling' ? 'Cold Calling' : 'VA Support'}${pendingCampaign.method === 'va-support' ? ' - ' + (pendingCampaign.campaignType || '') + ' Plan' : ' Campaign'}`
      });
      if (transactionError) {
        toast({
          title: "Error",
          description: `Failed to create transaction: ${transactionError.message}`,
          variant: "destructive"
        });
        return;
      }

      // Create campaign entry
      const campaignName =
        pendingCampaign.method === 'facebook-ads'
          ? `Facebook Ads - ${pendingCampaign.targetAudience?.name} - ${pendingCampaign.campaignType}`
          : pendingCampaign.method === 'cold-calling'
          ? `Cold Calling Campaign - ${pendingCampaign.hours} hours/month`
          : `VA Support - ${pendingCampaign.campaignType}`;

      const { data: campaign, error: campaignError } = await supabase
        .from('lead_gen_campaigns')
        .upsert({
          name: campaignName,
          description:
            pendingCampaign.method === 'facebook-ads'
              ? `Facebook advertising campaign targeting ${pendingCampaign.targetAudience?.name}`
              : pendingCampaign.method === 'cold-calling'
              ? `Professional cold calling service for ${pendingCampaign.hours} hours per month`
              : `Virtual assistant support plan: ${pendingCampaign.campaignType}`,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          total_budget: budget * 12,
          status: 'active',
          created_by: user.id
        })
        .select()
        .single();
      if (campaignError) {
        toast({
          title: "Error",
          description: `Failed to create campaign: ${campaignError.message}`,
          variant: "destructive"
        });
        return;
      }

      // Calculate next billing date (first of next month)
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      nextBillingDate.setDate(1);
      const billingDay = 1;

      const monthlyBudget = budget;
      const { error } = await supabase.from('campaign_participants').insert({
        campaign_id: campaign.id,
        user_id: user.id,
        consultant_name: pendingCampaign.consultantName,
        budget_contribution: monthlyBudget,
        next_billing_date: nextBillingDate.toISOString().split('T')[0],
        billing_cycle_day: billingDay,
        billing_status: 'active',
        proration_enabled: !!pendingCampaign.prorateFirstMonth,
        monthly_budget: monthlyBudget
      });
      if (error) {
        toast({
          title: "Error",
          description: `Failed to add campaign participant: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      // Prepare success modal data
      setSuccessCampaignDetails({
        id: campaign.id,
        name: campaignName,
        description:
          pendingCampaign.method === 'facebook-ads'
            ? `Facebook advertising campaign targeting ${pendingCampaign.targetAudience?.name}`
            : pendingCampaign.method === 'cold-calling'
            ? `Professional cold calling service for ${pendingCampaign.hours} hours per month`
            : `Virtual assistant support plan: ${pendingCampaign.campaignType}`,
        method: pendingCampaign.method,
        targetAudience: pendingCampaign.targetAudience,
        campaignType: pendingCampaign.campaignType,
        budget: budget,
        consultantName: pendingCampaign.consultantName,
        hours: pendingCampaign.hours
      });

      await refreshProfile();
      setShowCheckoutModal(false);
      setShowSuccessModal(true);
      setPendingCampaign(null);
      setCurrentFlow('method-selection');
      toast({
        title: "Campaign Launched Successfully! 🎉",
        description: `${amountToDeduct} points deducted from your account.`
      });
    } catch (error) {
      console.error('Campaign creation failed:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Error",
        description: `Failed to process campaign: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  const campaignTypes = [
    {
      type: 'facebook-ads',
      title: 'Facebook Ad Campaigns',
      description: 'Launch targeted Facebook advertising campaigns with proven templates and creatives',
      icon: Target,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      features: ['Proven ad templates', 'Targeted audiences', 'Creative assets included', 'Performance tracking']
    },
    {
      type: 'cold-calling',
      title: 'Cold Calling Campaigns',
      description: 'Professional cold calling services with trained telemarketers',
      icon: Phone,
      color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      features: ['Trained professionals', 'Flexible hours', 'Lead qualification', 'CRM integration']
    },
    {
      type: 'va-support',
      title: 'VA Support Campaigns',
      description: 'Virtual assistant support for lead follow-up and appointment setting',
      icon: Users,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
      features: ['Follow-up automation', 'Appointment setting', 'Lead qualification', 'CRM updates']
    }
  ];

  return (
    <SidebarLayout title="Launch New Campaign" description="Select a campaign type to get started">
      <ResponsiveContainer>
        <div className={isMobile ? "pt-4" : "pt-8"}>
          <div className={isMobile ? "mb-4" : "mb-6 sm:mb-8"}>
            <div className="flex items-center gap-2 mb-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/campaigns/my-campaigns')}
                className="flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to My Campaigns
              </Button>
            </div>
          </div>

          {/* Wallet Balance Card */}
          <div className="flex justify-center mb-8">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center bg-gradient-to-r from-primary/5 to-primary/10">
                <h2 className="text-lg font-semibold mb-2">Campaign Wallet</h2>
                <div className="text-3xl font-bold text-primary mb-4">
                  {profile?.flexi_credits_balance || 0} points
                </div>
                <Button 
                  onClick={() => setTopUpModalOpen(true)}
                  className="w-full"
                  variant="outline"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Top Up Wallet
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Launch Campaign Flow */}
          <div className="max-w-4xl mx-auto">
            {currentFlow === 'method-selection' && (
              <CampaignMethodSelector 
                onMethodSelect={handleMethodSelect}
              />
            )}

            {currentFlow === 'facebook-ads' && (
              <FacebookAdsCatalog 
                onBack={handleBackToMethods}
                onComplete={handleCampaignComplete}
                userBalance={profile?.flexi_credits_balance || 0}
                campaignTargets={[]}
              />
            )}

            {currentFlow === 'cold-calling' && (
              <ColdCallingWizard 
                onBack={handleBackToMethods}
                onComplete={handleCampaignComplete}
                userBalance={profile?.flexi_credits_balance || 0}
              />
            )}

            {currentFlow === 'va-support' && (
              <VASupportPlans 
                onBack={handleBackToMethods}
                onSubscribe={handleVASubscribe}
                larkMemoUrl=""
              />
            )}
          </div>
        </div>
      </ResponsiveContainer>

      {/* Checkout Confirmation Modal */}
      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Campaign Launch</DialogTitle>
            <DialogDescription>
              Please review your campaign details before launching.
            </DialogDescription>
          </DialogHeader>
          {pendingCampaign && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Campaign Type</h3>
                <p className="text-sm text-muted-foreground">
                  {pendingCampaign.method === 'facebook-ads' ? 'Facebook Ads' :
                   pendingCampaign.method === 'cold-calling' ? 'Cold Calling' : 'VA Support'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Monthly Budget</h3>
                <p className="text-sm text-muted-foreground">{pendingCampaign.budget} points</p>
              </div>
              {pendingCampaign.targetAudience && (
                <div>
                  <h3 className="font-semibold">Target Audience</h3>
                  <p className="text-sm text-muted-foreground">{pendingCampaign.targetAudience.name}</p>
                </div>
              )}
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">
                  <strong>Today's charge:</strong> {Math.max(1, Math.round((pendingCampaign.budget * (new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate() + 1)) / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()))} points (prorated)
                </p>
                <p className="text-sm text-muted-foreground">
                  Future billing: {pendingCampaign.budget} points on the 1st of each month
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckoutModal(false)}>
              Cancel
            </Button>
            <Button onClick={confirmCheckout}>
              Launch Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <CampaignLaunchSuccessModal 
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        campaignDetails={successCampaignDetails}
      />

      {/* Top Up Modal */}
      <TopUpModal 
        isOpen={topUpModalOpen}
        onClose={() => setTopUpModalOpen(false)}
        onSuccess={handleTopUpSuccess}
      />
    </SidebarLayout>
  );
});

// Skeleton component for campaign flow loading moved to PageSkeleton.tsx

CampaignLaunch.displayName = 'CampaignLaunch';

export default CampaignLaunch;