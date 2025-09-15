import React, { useState, lazy, Suspense, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveContainer } from '@/components/ui/mobile-responsive';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowRight, Target, Phone, Users, BarChart3, Plus, DollarSign, Settings, LogOut, Pause, Play, CreditCard, Shield, User, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TopUpModal } from '@/components/TopUpModal';
import { CampaignLaunchSuccessModal } from '@/components/campaigns/CampaignLaunchSuccessModal';
import { AdminInterface } from '@/components/campaigns/AdminInterface';
import { CampaignMethodSelector } from '@/components/campaigns/CampaignMethodSelector';
import { FacebookAdsCatalog } from '@/components/campaigns/FacebookAdsCatalog';
import { ColdCallingWizard } from '@/components/campaigns/ColdCallingWizard';
import { VASupportPlans } from '@/components/campaigns/VASupportPlans';
import { useToast } from '@/hooks/use-toast';
import { useCampaignTargets } from '@/hooks/useCampaignTargets';
import { supabase } from '@/integrations/supabase/client';

// Lazy load heavy components for optimal performance
const ActiveCampaigns = lazy(() => import('@/components/campaigns/ActiveCampaigns').then(m => ({ default: m.ActiveCampaigns })));
const SuperAdminInterface = lazy(() => import('@/components/campaigns/SuperAdminInterface').then(m => ({ default: m.SuperAdminInterface })));

const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map(i => (
      <Card key={i}>
        <CardContent className="p-6">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const Campaigns = React.memo(() => {
  const isMobile = useIsMobile();
  const { user, signOut, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [hideInactiveCampaigns, setHideInactiveCampaigns] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<'method-selection' | 'facebook-ads' | 'cold-calling' | 'va-support'>('method-selection');
  const [isAdmin, setIsAdmin] = useState(false);
  const { campaignTargets, setCampaignTargets, refreshTargets } = useCampaignTargets();
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [pendingCampaign, setPendingCampaign] = useState<any>(null);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [userCampaigns, setUserCampaigns] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successCampaignDetails, setSuccessCampaignDetails] = useState<any>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [editingTarget, setEditingTarget] = useState<any>(null);
  const [showTargetDialog, setShowTargetDialog] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    fetchUserCampaigns();
    handleURLParameters();
  }, [user, profile]);

  // Handle URL parameters for checkout success
  const handleURLParameters = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const topupStatus = urlParams.get('topup');
    const points = urlParams.get('points');
    if (topupStatus === 'success' && points) {
      toast({
        title: "Payment Successful!",
        description: `${points} points have been added to your account.`
      });

      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      // Refresh profile to show updated points
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

  const fetchUserCampaigns = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('campaign_participants').select(`
          *,
          lead_gen_campaigns (
            id,
            name,
            description,
            status,
            start_date,
            end_date,
            total_budget
          )
        `).eq('user_id', user.id).order('joined_at', { ascending: false });
      if (error) throw error;
      setUserCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching user campaigns:', error);
    }
  };

  const checkAdminStatus = async () => {
    if (!user) return;
    console.log('Checking admin status for user:', user.id, user.email);
    console.log('Profile from context:', profile);

    // First try to use the profile from context
    if (profile) {
      console.log('Using profile from context, role:', profile.role);
      if (profile.role === 'admin') {
        console.log('User is admin (from context), setting isAdmin to true');
        setIsAdmin(true);
        return;
      }
    }

    // Fallback to API call if profile not available
    try {
      const { data, error } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
      console.log('Admin check API response:', { data, error });
      if (data && data.role === 'admin') {
        console.log('User is admin (from API), setting isAdmin to true');
        setIsAdmin(true);
      } else {
        console.log('User is not admin, role:', data?.role);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
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

  // VA Support wallet-based subscribe flow
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

      // Compute immediate charge (prorated when enabled)
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const day = now.getDate();
      const remainingDays = daysInMonth - day + 1;
      const proratedAmount = Math.max(1, Math.round((budget * remainingDays) / daysInMonth));
      const isProrated = !!pendingCampaign.prorateFirstMonth;
      const amountToDeduct = isProrated ? proratedAmount : budget;

      console.log('Starting campaign creation process...');
      console.log('Budget (monthly):', budget, 'Amount to deduct (now):', amountToDeduct, 'User Balance:', userBalance);

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
      fetchUserCampaigns();
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

  const handleStopCampaign = async (participantId: string) => {
    try {
      const { error } = await supabase.from('campaign_participants').update({
        billing_status: 'stopped',
        updated_at: new Date().toISOString()
      }).eq('id', participantId).eq('user_id', user?.id);
      if (error) throw error;
      toast({
        title: "Billing Paused",
        description: "Monthly billing has been paused. Your campaign will continue running and you won't be charged next cycle."
      });
      fetchUserCampaigns();
    } catch (error) {
      console.error('Error pausing billing:', error);
      toast({
        title: "Error",
        description: "Failed to pause billing. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReactivateCampaign = async (participantId: string) => {
    try {
      const { error } = await supabase.from('campaign_participants').update({
        billing_status: 'active',
        updated_at: new Date().toISOString()
      }).eq('id', participantId).eq('user_id', user?.id);
      if (error) throw error;
      toast({
        title: "Billing Resumed",
        description: "Monthly billing has been resumed. You'll be charged starting next cycle."
      });
      fetchUserCampaigns();
    } catch (error) {
      console.error('Error resuming billing:', error);
      toast({
        title: "Error",
        description: "Failed to resume billing. Please try again.",
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
      path: '/campaigns/facebook-ads',
      features: ['Proven ad templates', 'Targeted audiences', 'Creative assets included', 'Performance tracking']
    },
    {
      type: 'cold-calling',
      title: 'Cold Calling Campaigns',
      description: 'Professional cold calling services with trained telemarketers',
      icon: Phone,
      color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      path: '/campaigns/cold-calling',
      features: ['Trained professionals', 'Flexible hours', 'Lead qualification', 'CRM integration']
    },
    {
      type: 'va-support',
      title: 'VA Support Campaigns',
      description: 'Virtual assistant support for lead follow-up and appointment setting',
      icon: Users,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
      path: '/campaigns/va-support',
      features: ['Follow-up automation', 'Appointment setting', 'Lead qualification', 'CRM updates']
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <ResponsiveContainer>
        <div className={isMobile ? "pt-4" : "pt-8"}>
          <div className={isMobile ? "mb-4" : "mb-6 sm:mb-8"}>
            <h1 className={isMobile ? "text-xl font-bold text-foreground mb-2" : "text-2xl sm:text-3xl font-bold text-foreground mb-2"}>
              Lead Generation Campaigns
            </h1>
            <p className={isMobile ? "text-sm text-muted-foreground" : "text-muted-foreground text-sm sm:text-base"}>
              Launch new campaigns or manage your existing ones
            </p>
          </div>

          {/* Wallet Balance Card */}
          <div className="flex justify-center mb-8">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center bg-gradient-to-r from-primary/5 to-primary/10">
                <h2 className="text-lg font-semibold mb-2">Campaign Wallet</h2>
                <p className="text-3xl font-bold text-primary mb-2">{(profile?.flexi_credits_balance || 0).toLocaleString()} flexi-credits</p>
                <p className="text-sm text-muted-foreground mb-4">Available for campaigns</p>
                <Button onClick={() => setTopUpModalOpen(true)} size="sm" className="w-full">
                  Top Up Wallet
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="launch" className="w-full">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="launch" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Launch Campaign
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                My Campaigns
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Admin Tools
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="launch" className="mt-6">
              {/* Campaign Flow */}
              {currentFlow === 'method-selection' && <CampaignMethodSelector onMethodSelect={handleMethodSelect} />}

              {currentFlow === 'facebook-ads' && <FacebookAdsCatalog onComplete={handleCampaignComplete} onBack={handleBackToMethods} userBalance={profile?.flexi_credits_balance || 0} campaignTargets={campaignTargets} />}

              {currentFlow === 'cold-calling' && <ColdCallingWizard onComplete={handleCampaignComplete} onBack={handleBackToMethods} userBalance={profile?.flexi_credits_balance || 0} />}

              {currentFlow === 'va-support' && <VASupportPlans onBack={handleBackToMethods} larkMemoUrl="https://nsgukkz32942.sg.larksuite.com/wiki/EH74wip5Zi2lLOksfjWlIv9Tgkc" onSubscribe={handleVASubscribe} />}
            </TabsContent>

            <TabsContent value="active" className="mt-6">
              {/* User Campaigns Management */}
              {userCampaigns.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Your Campaigns</h2>
                    <div className="flex items-center gap-4">
                      <Button
                        variant={hideInactiveCampaigns ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHideInactiveCampaigns(!hideInactiveCampaigns)}
                        className="text-sm"
                      >
                        {hideInactiveCampaigns ? "Show All" : "Hide Inactive"}
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        {userCampaigns.filter(c => c.billing_status === 'active').length} active • {userCampaigns.length} total
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {userCampaigns
                      .filter(participation => {
                        if (hideInactiveCampaigns) {
                          return participation.billing_status === 'active';
                        }
                        return true;
                      })
                      .sort((a, b) => {
                        if (a.billing_status === 'active' && b.billing_status !== 'active') return -1;
                        if (a.billing_status !== 'active' && b.billing_status === 'active') return 1;
                        return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime();
                      })
                      .filter(participation => participation.lead_gen_campaigns)
                      .map(participation => {
                        const campaign = participation.lead_gen_campaigns;
                        const isColdCalling = campaign.name?.includes('Cold Calling') || false;
                        const IconComponent = isColdCalling ? Phone : Target;
                        const isActive = participation.billing_status === 'active';
                        const isStopped = participation.billing_status === 'stopped';

                        const startDate = new Date(participation.joined_at);
                        const today = new Date();
                        const daysRunning = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

                        return (
                          <Card key={participation.id} className={`transition-all duration-300 ${isActive ? 'hover:shadow-lg border-border hover:border-primary/30' : 'border-warning/40 bg-muted/50 opacity-60'}`}>
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4 mb-6">
                                <div className={`${isActive ? isColdCalling ? 'bg-green-500/10' : 'bg-blue-500/10' : 'bg-warning/10'} p-3 rounded-lg flex-shrink-0`}>
                                  <IconComponent className={`h-6 w-6 ${isActive ? isColdCalling ? 'text-green-600' : 'text-blue-600' : 'text-warning'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-lg">{campaign.name}</h3>
                                    <Badge variant={isActive ? 'default' : 'outline'} className={`text-xs ${isStopped ? 'border-warning/40 text-warning bg-warning/10' : isActive ? 'bg-green-500/10 text-green-700 border-green-200' : ''}`}>
                                      {isActive ? 'Active' : 'Paused'}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <span>Running for {daysRunning} days</span>
                                    <span>•</span>
                                    <span>{participation.budget_contribution} pts/month</span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">Next billing: </span>
                                    <span className="font-medium">
                                      {participation.next_billing_date ? new Date(participation.next_billing_date).toLocaleDateString() : 'Not scheduled'}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex gap-2">
                                  {participation.billing_status === 'active' ? (
                                    <Button variant="outline" size="sm" onClick={() => handleStopCampaign(participation.id)} className="flex-1 border-warning text-warning hover:bg-warning hover:text-warning-foreground">
                                      <Pause className="h-4 w-4 mr-2" />
                                      Pause Billing
                                    </Button>
                                  ) : participation.billing_status === 'stopped' ? (
                                    <Button variant="outline" size="sm" onClick={() => handleReactivateCampaign(participation.id)} className="flex-1">
                                      <Play className="h-4 w-4 mr-2" />
                                      Resume Billing
                                    </Button>
                                  ) : null}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="px-3">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>View Details</DropdownMenuItem>
                                      <DropdownMenuItem>Edit Campaign</DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-destructive">Cancel Campaign</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                
                                {participation.billing_status === 'stopped' && (
                                  <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                                    <p className="text-sm text-warning flex items-center gap-2">
                                      <CreditCard className="h-4 w-4" />
                                      Billing paused - Campaign continues running
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      No charges on your next billing cycle. Resume anytime to continue automated billing.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 max-w-2xl mx-auto">
                  <div className="bg-muted/30 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <Target className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Active Campaigns</h3>
                  <p className="text-muted-foreground mb-6">
                    Start your first lead generation campaign to begin attracting potential clients to your business.
                  </p>
                  <Button onClick={() => setCurrentFlow('method-selection')} className="inline-flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Campaign
                  </Button>
                </div>
              )}
            </TabsContent>

            {isAdmin && (
              <TabsContent value="admin" className="mt-6">
                <AdminInterface 
                  campaignTargets={campaignTargets} 
                  setCampaignTargets={setCampaignTargets} 
                  editingTarget={editingTarget} 
                  setEditingTarget={setEditingTarget} 
                  showTargetDialog={showTargetDialog} 
                  setShowTargetDialog={setShowTargetDialog} 
                  refreshTargets={refreshTargets} 
                />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </ResponsiveContainer>

      {/* Checkout Confirmation Modal */}
      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Confirm Your Campaign
            </DialogTitle>
            <DialogDescription>
              Review your campaign details and confirm the payment
            </DialogDescription>
          </DialogHeader>
          
          {pendingCampaign && (() => {
            const today = new Date();
            const totalDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            const remainingDays = Math.max(0, totalDays - today.getDate() + 1);
            const proratedAmount = Math.max(1, Math.round((pendingCampaign.budget * remainingDays) / totalDays));
            const isProrated = !!pendingCampaign.prorateFirstMonth;
            const amountToDeduct = isProrated ? proratedAmount : pendingCampaign.budget;
            const userBalance = profile?.flexi_credits_balance || 0;
            const balanceAfter = userBalance - amountToDeduct;
            return (
              <div className="space-y-4">
                <div className="bg-muted/20 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Campaign Type:</span>
                    <span className="text-sm">{pendingCampaign.method === 'facebook-ads' ? 'Facebook Ads' : pendingCampaign.method === 'cold-calling' ? 'Cold Calling' : 'VA Support'}</span>
                  </div>
                  {pendingCampaign.targetAudience && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Target Audience:</span>
                      <span className="text-sm">{pendingCampaign.targetAudience.name}</span>
                    </div>
                  )}
                  {pendingCampaign.campaignType && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Campaign Type:</span>
                      <span className="text-sm">{pendingCampaign.campaignType}</span>
                    </div>
                  )}
                  {pendingCampaign.hours && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Hours/Month:</span>
                      <span className="text-sm">{pendingCampaign.hours}h</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Monthly Cost:</span>
                    <span className="text-sm font-bold">{pendingCampaign.budget} points</span>
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Current Balance:</span>
                    <span className="text-sm font-bold">{userBalance.toLocaleString()} points</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Amount to Deduct Now:</span>
                    <span className="text-sm font-bold text-red-600">-{amountToDeduct} points</span>
                  </div>
                  {isProrated && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Prorated for the remaining {remainingDays} day{remainingDays !== 1 ? 's' : ''} this month.
                    </p>
                  )}
                  <div className="mt-2 text-xs text-muted-foreground">
                    <div className="font-medium">Next deduction</div>
                    <div>
                      {new Date(today.getFullYear(), today.getMonth() + 1, 1).toLocaleDateString()} • {pendingCampaign.budget} points
                    </div>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Balance After:</span>
                      <span className="text-lg font-bold text-primary">
                        {balanceAfter.toLocaleString()} points
                      </span>
                    </div>
                  </div>
                </div>

                {balanceAfter < -1000 && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                    <p className="text-sm text-red-800">
                      ⚠️ Balance limit exceeded. This would bring your balance to {balanceAfter} points.
                      The minimum allowed balance is -1000 points.
                    </p>
                  </div>
                )}

                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setShowCheckoutModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={confirmCheckout} className="flex-1" disabled={balanceAfter < -1000}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    {balanceAfter < -1000 ? 'Balance Limit Exceeded' : 'Confirm & Launch'}
                  </Button>
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <TopUpModal isOpen={topUpModalOpen} onClose={() => setTopUpModalOpen(false)} onSuccess={handleTopUpSuccess} />

      {successCampaignDetails && (
        <CampaignLaunchSuccessModal 
          isOpen={showSuccessModal} 
          onClose={() => {
            setShowSuccessModal(false);
            setSuccessCampaignDetails(null);
          }} 
          campaignDetails={successCampaignDetails} 
        />
      )}
    </div>
  );
});

Campaigns.displayName = "Campaigns";

export default Campaigns;