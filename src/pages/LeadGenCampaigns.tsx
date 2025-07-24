
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Navigation } from "@/components/Navigation";
import { DollarSign, Target, Phone, Settings, LogOut, Pause, Play, CreditCard } from "lucide-react";
import { TopUpModal } from "@/components/TopUpModal";
import { CampaignLaunchSuccessModal } from "@/components/campaigns/CampaignLaunchSuccessModal";
import { AdminInterface } from "@/components/campaigns/AdminInterface";
import { CampaignMethodSelector } from "@/components/campaigns/CampaignMethodSelector";
import { FacebookAdsWizard } from "@/components/campaigns/FacebookAdsWizard";
import { ColdCallingWizard } from "@/components/campaigns/ColdCallingWizard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Default campaign targets
const DEFAULT_CAMPAIGN_TARGETS = [
  {
    id: 'nsf',
    name: 'NSFs',
    description: 'Target National Service personnel with financial planning services',
    icon: Target,
    bgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-600',
    budgetRange: {
      min: 200,
      max: 1500,
      recommended: 500
    },
    campaignTypes: ['Facebook Lead Ads', 'Facebook Conversion Ads', 'Facebook Engagement Ads']
  },
  {
    id: 'public',
    name: 'General Public',
    description: 'General public seeking comprehensive financial services',
    icon: Target,
    bgColor: 'bg-green-500/10',
    iconColor: 'text-green-600',
    budgetRange: {
      min: 300,
      max: 2500,
      recommended: 800
    },
    campaignTypes: ['Facebook Lead Ads', 'Facebook Traffic Ads', 'Facebook Brand Awareness']
  },
  {
    id: 'seniors',
    name: 'Seniors',
    description: 'Target seniors with retirement and estate planning services',
    icon: Target,
    bgColor: 'bg-purple-500/10',
    iconColor: 'text-purple-600',
    budgetRange: {
      min: 400,
      max: 3000,
      recommended: 1000
    },
    campaignTypes: ['Facebook Lead Ads', 'Facebook Video Ads', 'Facebook Retargeting Ads']
  }
];

const LeadGenCampaigns = () => {
  const { user, signOut, profile } = useAuth();
  const { toast } = useToast();
  const [currentFlow, setCurrentFlow] = useState<'method-selection' | 'facebook-ads' | 'cold-calling'>('method-selection');
  const [isAdmin, setIsAdmin] = useState(false);
  const [campaignTargets, setCampaignTargets] = useState(DEFAULT_CAMPAIGN_TARGETS);
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
  }, [user, profile]);

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
      
      // Check sufficient balance
      if (userBalance < budget) {
        toast({
          title: "Insufficient Balance",
          description: "Please top up your wallet to proceed.",
          variant: "destructive",
        });
        return;
      }

      // Deduct points and create transaction
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ points_balance: userBalance - budget })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      const { error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          user_id: user.id,
          amount: -budget,
          type: 'purchase',
          description: `${pendingCampaign.method === 'facebook-ads' ? 'Facebook Ads' : 'Cold Calling'} Campaign`
        });

      if (transactionError) throw transactionError;

      // Create campaign entry
      const campaignName = pendingCampaign.method === 'facebook-ads' 
        ? `Facebook Ads - ${pendingCampaign.targetAudience?.name} - ${pendingCampaign.campaignType}`
        : `Cold Calling Campaign - ${pendingCampaign.hours} hours/month`;

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
          status: 'pending_activation',
          created_by: user.id
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      const { error } = await supabase
        .from('campaign_participants')
        .insert({
          campaign_id: campaign.id,
          user_id: user.id,
          consultant_name: pendingCampaign.consultantName,
          budget_contribution: budget
        });

      if (error) throw error;

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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
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
              <h2 className="text-2xl font-bold mb-8 text-center">Your Campaigns</h2>
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
                  
                  // Dynamic styling based on billing status
                  const iconColor = isActive 
                    ? (isColdCalling ? 'text-green-600' : 'text-blue-600')
                    : 'text-warning';
                  const bgColor = isActive 
                    ? (isColdCalling ? 'bg-green-500/10' : 'bg-blue-500/10')
                    : 'bg-warning/10';
                  
                  return (
                    <Card 
                      key={participation.id} 
                      className={`transition-all duration-300 ${
                        isActive 
                          ? 'hover:shadow-lg border-border' 
                          : 'border-warning/40'
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4 mb-6">
                          <div className={`${bgColor} p-3 rounded-lg flex-shrink-0`}>
                            <IconComponent className={`h-6 w-6 ${iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1">{campaign.name}</h3>
                            <p className="text-sm text-muted-foreground">{campaign.description}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isStopped && <CreditCard className="h-4 w-4 text-warning" />}
                            {isActive && <Play className="h-4 w-4 text-green-600" />}
                            <Badge 
                              variant={isActive ? 'default' : 'outline'}
                              className={`capitalize ${
                                isStopped 
                                  ? 'border-warning/40 text-warning bg-warning/10' 
                                  : ''
                              }`}
                            >
                              {isActive ? 'Campaign Active • Billing Active' : 'Campaign Active • Billing Paused'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-3">
                            <Badge variant="outline" className="bg-primary/5">
                              {participation.budget_contribution} points Monthly
                            </Badge>
                            <Badge variant={
                              participation.billing_status === 'active' ? 'default' : 
                              participation.billing_status === 'stopped' ? 'outline' : 'secondary'
                            } className={
                              participation.billing_status === 'stopped' 
                                ? 'border-warning/40 text-warning bg-warning/10' 
                                : ''
                            }>
                              {participation.billing_status === 'active' ? 'Billing Active' :
                               participation.billing_status === 'stopped' ? 'Billing Paused' :
                               participation.billing_status === 'paused_insufficient_funds' ? 'Paused - Low Balance' :
                               'Unknown Status'}
                            </Badge>
                          </div>

                          <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Joined: </span>
                                <span className="font-semibold">
                                  {new Date(participation.joined_at).toLocaleDateString()}
                                </span>
                              </div>
                              {participation.next_billing_date && (
                                <div>
                                  <span className="text-muted-foreground">Next Billing: </span>
                                  <span className="font-semibold">
                                    {new Date(participation.next_billing_date).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              {participation.billing_status === 'active' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStopCampaign(participation.id)}
                                  className="border-warning text-warning hover:bg-warning hover:text-warning-foreground"
                                >
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pause Billing
                                </Button>
                              ) : participation.billing_status === 'stopped' ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleReactivateCampaign(participation.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Resume Billing
                                </Button>
                              ) : null}
                            </div>
                            
                            {/* Explanatory text for billing paused campaigns */}
                            {participation.billing_status === 'stopped' && (
                              <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                                <p className="text-sm text-warning flex items-center gap-2">
                                  <CreditCard className="h-4 w-4" />
                                  Billing paused - Campaign continues running, no charges next cycle
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  You won't be charged on: {participation.next_billing_date 
                                    ? new Date(participation.next_billing_date).toLocaleDateString()
                                    : 'Next billing cycle'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Leads will still be generated during billing pause
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
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
              Confirm & Launch
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
