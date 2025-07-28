import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Navigation } from "@/components/Navigation";
import { DollarSign, Target, Phone, Settings, LogOut, Pause, Play, CreditCard, Shield, Users, User, Plus, MoreVertical } from "lucide-react";
import { TopUpModal } from "@/components/TopUpModal";
import { CampaignLaunchSuccessModal } from "@/components/campaigns/CampaignLaunchSuccessModal";
import { AdminInterface } from "@/components/campaigns/AdminInterface";
import { CampaignMethodSelector } from "@/components/campaigns/CampaignMethodSelector";
import { FacebookAdsWizard } from "@/components/campaigns/FacebookAdsWizard";
import { ColdCallingWizard } from "@/components/campaigns/ColdCallingWizard";
import { useToast } from "@/hooks/use-toast";
import { useCampaignTargets } from "@/hooks/useCampaignTargets";
import { supabase } from "@/integrations/supabase/client";

const LeadGenCampaigns = () => {
  const { user, signOut, profile } = useAuth();
  const { toast } = useToast();
  const [currentFlow, setCurrentFlow] = useState<'method-selection' | 'facebook-ads' | 'cold-calling'>('method-selection');
  const [isAdmin, setIsAdmin] = useState(false);
  const { campaignTargets, setCampaignTargets, refreshTargets } = useCampaignTargets();
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [pendingCampaign, setPendingCampaign] = useState<any>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [userCampaigns, setUserCampaigns] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successCampaignDetails, setSuccessCampaignDetails] = useState<any>(null);
  
  // Admin mode state
  const [adminMode, setAdminMode] = useState(false);
  const [editingTarget, setEditingTarget] = useState<any>(null);
  const [showTargetDialog, setShowTargetDialog] = useState(false);

  useEffect(() => {
    fetchUserBalance();
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
        description: `${points} points have been added to your account.`,
      });
      
      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // Refresh balance to show updated points
      setTimeout(() => {
        fetchUserBalance();
      }, 1000);
    }
  };


  const fetchUserCampaigns = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('campaign_participants')
        .select(`
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
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });
      
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
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
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

  const fetchUserBalance = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('points_balance')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      setUserBalance(data.points_balance || 0);
    } catch (error) {
      console.error('Error fetching user balance:', error);
    }
  };

  const handleTopUpSuccess = (points: number) => {
    setUserBalance(prev => prev + points);
    toast({
      title: "Top-up Successful! 🎉",
      description: `${points} points added to your account.`,
    });
  };

  const handleMethodSelect = (method: 'facebook-ads' | 'cold-calling') => {
    setCurrentFlow(method);
  };

  const handleBackToMethods = () => {
    setCurrentFlow('method-selection');
  };

  const handleCampaignComplete = (campaignData: any) => {
    setPendingCampaign(campaignData);
    setShowCheckoutModal(true);
  };

  const confirmCheckout = async () => {
    if (!user || !pendingCampaign) return;

    try {
      const budget = pendingCampaign.budget;
      
      console.log('Starting campaign creation process...');
      console.log('Budget:', budget, 'User Balance:', userBalance);
      console.log('Pending Campaign:', pendingCampaign);

      // Check sufficient balance
      if (userBalance < budget) {
        toast({
          title: "Insufficient Balance",
          description: `You need ${budget} points but only have ${userBalance} points. Please contact admin to add more points to your account.`,
          variant: "destructive",
        });
        return;
      }

      // Deduct points and create transaction
      console.log('Updating user balance...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ points_balance: userBalance - budget })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating balance:', updateError);
        toast({
          title: "Error",
          description: `Failed to update balance: ${updateError.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('Creating transaction record...');
      const { error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          user_id: user.id,
          amount: -budget,
          type: 'purchase',
          description: `${pendingCampaign.method === 'facebook-ads' ? 'Facebook Ads' : 'Cold Calling'} Campaign`
        });

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        toast({
          title: "Error",
          description: `Failed to create transaction: ${transactionError.message}`,
          variant: "destructive",
        });
        return;
      }

      // Create campaign entry
      const campaignName = pendingCampaign.method === 'facebook-ads' 
        ? `Facebook Ads - ${pendingCampaign.targetAudience?.name} - ${pendingCampaign.campaignType}`
        : `Cold Calling Campaign - ${pendingCampaign.hours} hours/month`;

      console.log('Creating campaign with name:', campaignName);
      const { data: campaign, error: campaignError } = await supabase
        .from('lead_gen_campaigns')
        .upsert({
          name: campaignName,
          description: pendingCampaign.method === 'facebook-ads' 
            ? `Facebook advertising campaign targeting ${pendingCampaign.targetAudience?.name}`
            : `Professional cold calling service for ${pendingCampaign.hours} hours per month`,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          total_budget: budget * 12,
          status: 'active',
          created_by: user.id
        })
        .select()
        .single();

      if (campaignError) {
        console.error('Error creating campaign:', campaignError);
        toast({
          title: "Error",
          description: `Failed to create campaign: ${campaignError.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('Created campaign:', campaign);
      
      // Calculate next billing date (one month from now)
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      const billingDay = nextBillingDate.getDate(); // Use current day of month as billing cycle day

      console.log('Adding campaign participant with billing schedule...');
      const { error } = await supabase
        .from('campaign_participants')
        .insert({
          campaign_id: campaign.id,
          user_id: user.id,
          consultant_name: pendingCampaign.consultantName,
          budget_contribution: budget,
          next_billing_date: nextBillingDate.toISOString().split('T')[0], // YYYY-MM-DD format
          billing_cycle_day: billingDay,
          billing_status: 'active'
        });

      if (error) {
        console.error('Error adding campaign participant:', error);
        toast({
          title: "Error",
          description: `Failed to add campaign participant: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('Campaign creation successful!');

      // Prepare success modal data
      setSuccessCampaignDetails({
        id: campaign.id,
        name: campaignName,
        description: pendingCampaign.method === 'facebook-ads' 
          ? `Facebook advertising campaign targeting ${pendingCampaign.targetAudience?.name}`
          : `Professional cold calling service for ${pendingCampaign.hours} hours per month`,
        method: pendingCampaign.method,
        targetAudience: pendingCampaign.targetAudience,
        campaignType: pendingCampaign.campaignType,
        budget: budget,
        consultantName: pendingCampaign.consultantName,
        hours: pendingCampaign.hours
      });

      // Refresh balance from database to ensure accuracy
      await fetchUserBalance();
      setShowCheckoutModal(false);
      setShowSuccessModal(true);
      setPendingCampaign(null);
      setCurrentFlow('method-selection');
      fetchUserCampaigns();

      toast({
        title: "Campaign Launched Successfully! 🎉",
        description: `${budget} points deducted from your account.`,
      });

    } catch (error) {
      console.error('Campaign creation failed:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Error",
        description: `Failed to process campaign: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleStopCampaign = async (participantId: string) => {
    try {
      const { error } = await supabase
        .from('campaign_participants')
        .update({ 
          billing_status: 'stopped',
          updated_at: new Date().toISOString()
        })
        .eq('id', participantId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Billing Paused",
        description: "Monthly billing has been paused. Your campaign will continue running and you won't be charged next cycle.",
      });

      fetchUserCampaigns();
    } catch (error) {
      console.error('Error pausing billing:', error);
      toast({
        title: "Error",
        description: "Failed to pause billing. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReactivateCampaign = async (participantId: string) => {
    try {
      const { error } = await supabase
        .from('campaign_participants')
        .update({ 
          billing_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', participantId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Billing Resumed", 
        description: "Monthly billing has been resumed. You'll be charged starting next cycle.",
      });

      fetchUserCampaigns();
    } catch (error) {
      console.error('Error resuming billing:', error);
      toast({
        title: "Error",
        description: "Failed to resume billing. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex justify-between items-center mb-6">
              <Button 
                variant="outline" 
                size="sm"
                onClick={signOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
              
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <Button 
                    variant={adminMode ? "default" : "secondary"} 
                    size="sm"
                    onClick={() => {
                      console.log('Admin mode toggle clicked, current adminMode:', adminMode);
                      setAdminMode(!adminMode);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {adminMode ? "Exit Admin Mode" : "Admin Mode"}
                  </Button>
                )}
                <div className="text-sm text-muted-foreground">
                  Debug: isAdmin={isAdmin.toString()}, adminMode={adminMode.toString()}
                </div>
              </div>
            </div>
        
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Financial Advisory Lead Generation
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose your lead generation strategy to grow your financial consulting business in Singapore.
              </p>
            </div>
          </div>

          {/* Wallet Balance Card */}
          <div className="flex justify-center mb-8">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center bg-gradient-to-r from-primary/5 to-primary/10">
                <h2 className="text-lg font-semibold mb-2">Campaign Wallet</h2>
                <p className="text-3xl font-bold text-primary mb-2">{userBalance.toLocaleString()} points</p>
                <p className="text-sm text-muted-foreground mb-4">Available for campaigns</p>
                <Button 
                  onClick={() => setTopUpModalOpen(true)}
                  size="sm"
                  className="w-full"
                >
                  Top Up Wallet
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns Section */}
          {!adminMode && userCampaigns.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold">Your Campaigns</h2>
                {userCampaigns.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {userCampaigns.filter(c => c.billing_status === 'active').length} active • {userCampaigns.length} total
                  </div>
                )}
              </div>

              {userCampaigns.length === 0 ? (
                <div className="text-center py-12 max-w-2xl mx-auto">
                  <div className="bg-muted/30 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <Target className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Active Campaigns</h3>
                  <p className="text-muted-foreground mb-6">
                    Start your first lead generation campaign to begin attracting potential clients to your business.
                  </p>
                  <Button 
                    onClick={() => setCurrentFlow('method-selection')}
                    className="inline-flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Your First Campaign
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
                  {userCampaigns
                    .sort((a, b) => {
                      // Active campaigns first, then stopped campaigns
                      if (a.billing_status === 'active' && b.billing_status !== 'active') return -1;
                      if (a.billing_status !== 'active' && b.billing_status === 'active') return 1;
                      return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime();
                    })
                    .map((participation) => {
                    const campaign = participation.lead_gen_campaigns;
                    const isColdCalling = campaign.name.includes('Cold Calling');
                    const IconComponent = isColdCalling ? Phone : Target;
                    const isActive = participation.billing_status === 'active';
                    const isStopped = participation.billing_status === 'stopped';
                    
                    // Calculate campaign duration
                    const startDate = new Date(participation.joined_at);
                    const today = new Date();
                    const daysRunning = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                    
                    // Calculate performance metrics
                    const leadsReceived = participation.leads_received || 0;
                    const conversions = participation.conversions || 0;
                    const revenue = participation.revenue_generated || 0;
                    const conversionRate = leadsReceived > 0 ? ((conversions / leadsReceived) * 100).toFixed(1) : '0';
                    const totalSpent = participation.budget_contribution * Math.ceil(daysRunning / 30);
                    const roi = revenue > 0 && totalSpent > 0 ? (((revenue - totalSpent) / totalSpent) * 100).toFixed(1) : '0';
                    
                    return (
                       <Card 
                        key={participation.id} 
                        className={`transition-all duration-300 ${
                          isActive 
                            ? 'hover:shadow-lg border-border hover:border-primary/30' 
                            : 'border-warning/40 bg-muted/50 opacity-60'
                        }`}
                      >
                        <CardContent className="p-6">
                          {/* Header */}
                          <div className="flex items-start gap-4 mb-6">
                            <div className={`${isActive 
                              ? (isColdCalling ? 'bg-green-500/10' : 'bg-blue-500/10')
                              : 'bg-warning/10'
                            } p-3 rounded-lg flex-shrink-0`}>
                              <IconComponent className={`h-6 w-6 ${isActive 
                                ? (isColdCalling ? 'text-green-600' : 'text-blue-600')
                                : 'text-warning'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">{campaign.name}</h3>
                                <Badge 
                                  variant={isActive ? 'default' : 'outline'}
                                  className={`text-xs ${
                                    isStopped 
                                      ? 'border-warning/40 text-warning bg-warning/10' 
                                      : isActive ? 'bg-green-500/10 text-green-700 border-green-200' : ''
                                  }`}
                                >
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

                          {/* Status and Actions */}
                          <div className="space-y-4">
                            {/* Billing Info */}
                            <div className="flex items-center justify-between">
                              <div className="text-sm">
                                <span className="text-muted-foreground">Next billing: </span>
                                <span className="font-medium">
                                  {participation.next_billing_date 
                                    ? new Date(participation.next_billing_date).toLocaleDateString()
                                    : 'Not scheduled'}
                                </span>
                              </div>
                              {roi !== '0' && (
                                <Badge variant="outline" className={`${
                                  parseFloat(roi) > 0 ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'
                                }`}>
                                  {parseFloat(roi) > 0 ? '+' : ''}{roi}% ROI
                                </Badge>
                              )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              {participation.billing_status === 'active' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStopCampaign(participation.id)}
                                  className="flex-1 border-warning text-warning hover:bg-warning hover:text-warning-foreground"
                                >
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pause Billing
                                </Button>
                              ) : participation.billing_status === 'stopped' ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleReactivateCampaign(participation.id)}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                >
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
                                  <DropdownMenuItem>
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    Edit Campaign
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive">
                                    Cancel Campaign
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            
                            {/* Status Message */}
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
              )}
            </div>
          )}

          {/* Main Content Area */}
          <div className="max-w-6xl mx-auto">
            {/* Admin Mode Interface */}
            {adminMode ? (
              <AdminInterface 
                campaignTargets={campaignTargets}
                setCampaignTargets={setCampaignTargets}
                editingTarget={editingTarget}
                setEditingTarget={setEditingTarget}
                showTargetDialog={showTargetDialog}
                setShowTargetDialog={setShowTargetDialog}
                refreshTargets={refreshTargets}
              />
            ) : (
              <>
                {/* Campaign Flow */}
                {currentFlow === 'method-selection' && (
                  <CampaignMethodSelector onMethodSelect={handleMethodSelect} />
                )}

                {currentFlow === 'facebook-ads' && (
                  <FacebookAdsWizard
                    onComplete={handleCampaignComplete}
                    onBack={handleBackToMethods}
                    userBalance={userBalance}
                    campaignTargets={campaignTargets}
                  />
                )}

                {currentFlow === 'cold-calling' && (
                  <ColdCallingWizard
                    onComplete={handleCampaignComplete}
                    onBack={handleBackToMethods}
                    userBalance={userBalance}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

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
          
          {pendingCampaign && (
            <div className="space-y-4">
              <div className="bg-muted/20 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Campaign Type:</span>
                  <span className="text-sm">{pendingCampaign.method === 'facebook-ads' ? 'Facebook Ads' : 'Cold Calling'}</span>
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
                  <span className="text-sm font-medium">Amount to Deduct:</span>
                  <span className="text-sm font-bold text-red-600">-{pendingCampaign.budget} points</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Balance After:</span>
                    <span className="text-lg font-bold text-primary">
                      {(userBalance - pendingCampaign.budget).toLocaleString()} points
                    </span>
                  </div>
                </div>
              </div>

              {userBalance < pendingCampaign.budget && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                  <p className="text-sm text-red-800">
                    ⚠️ Insufficient balance. You need {pendingCampaign.budget - userBalance} more points.
                    Contact admin to add points to your account.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCheckoutModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmCheckout}
              className="flex-1"
              disabled={!pendingCampaign || userBalance < pendingCampaign.budget}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              {userBalance < (pendingCampaign?.budget || 0) ? 'Insufficient Balance' : 'Confirm & Launch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TopUpModal 
        isOpen={topUpModalOpen}
        onClose={() => setTopUpModalOpen(false)}
        onSuccess={handleTopUpSuccess}
      />

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
};

export default LeadGenCampaigns;
