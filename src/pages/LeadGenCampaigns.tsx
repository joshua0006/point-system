import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Navigation } from "@/components/Navigation";
import { TrendingUp, DollarSign, Target, Users, Plus, User, Shield, Phone, ArrowLeft, Settings, Edit3 } from "lucide-react";
import { TopUpModal } from "@/components/TopUpModal";
import { AdminInterface } from "@/components/campaigns/AdminInterface";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Campaign targeting options
const CAMPAIGN_TARGETS = [
  {
    id: 'nsf',
    name: 'NSFs',
    description: 'Target National Service personnel with financial planning services',
    icon: Shield,
    bgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-600',
    budgetRange: {
      min: 200,
      max: 1500,
      recommended: 500
    }
  },
  {
    id: 'public',
    name: 'General Public',
    description: 'General public seeking comprehensive financial services',
    icon: Users,
    bgColor: 'bg-green-500/10',
    iconColor: 'text-green-600',
    budgetRange: {
      min: 300,
      max: 2500,
      recommended: 800
    }
  },
  {
    id: 'seniors',
    name: 'Seniors',
    description: 'Target seniors with retirement and estate planning services',
    icon: User,
    bgColor: 'bg-purple-500/10',
    iconColor: 'text-purple-600',
    budgetRange: {
      min: 400,
      max: 3000,
      recommended: 1000
    }
  }
];


const LeadGenCampaigns = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [budgetAmount, setBudgetAmount] = useState("");
  const [consultantName, setConsultantName] = useState("");
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [isAdmin, setIsAdmin] = useState(true);
  const [campaignTargets, setCampaignTargets] = useState(CAMPAIGN_TARGETS);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  
  // New flow state management
  const [currentStep, setCurrentStep] = useState('audience-selection');
  
  // Admin mode state
  const [adminMode, setAdminMode] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [editingAd, setEditingAd] = useState(null);
  const [showTargetDialog, setShowTargetDialog] = useState(false);
  const [showAdDialog, setShowAdDialog] = useState(false);
  
  // Cold calling state
  const [showColdCallingModal, setShowColdCallingModal] = useState(false);
  const [showColdCallingCheckoutModal, setShowColdCallingCheckoutModal] = useState(false);
  const [selectedHours, setSelectedHours] = useState<number | null>(null);
  const [userCampaigns, setUserCampaigns] = useState([]);
  
  // Flow navigation functions
  const selectAudience = (target) => {
    setSelectedTarget(target);
    setCurrentStep('budget-launch');
  };
  
  const resetFlow = () => {
    setSelectedTarget(null);
    setCurrentStep('audience-selection');
  };

  const confirmColdCallingCheckout = async () => {
    if (!user || !selectedHours || !consultantName) return;

    try {
      const monthlyCost = selectedHours * 6; // 6 points per hour
      
      // Check sufficient balance
      if (userBalance < monthlyCost) {
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
        .update({ points_balance: userBalance - monthlyCost })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      const { error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          user_id: user.id,
          amount: -monthlyCost,
          type: 'purchase',
          description: `Cold Calling Campaign - ${selectedHours} hours/month`
        });

      if (transactionError) throw transactionError;

      // Create campaign entry
      const { data: coldCallingCampaign, error: campaignError } = await supabase
        .from('lead_gen_campaigns')
        .upsert({
          name: `Cold Calling Campaign - ${selectedHours} hours/month`,
          description: `Professional cold calling service for ${selectedHours} hours per month`,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          total_budget: monthlyCost * 12,
          status: 'active',
          created_by: user.id
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      const { error } = await supabase
        .from('campaign_participants')
        .insert({
          campaign_id: coldCallingCampaign.id,
          user_id: user.id,
          consultant_name: consultantName,
          budget_contribution: monthlyCost
        });

      if (error) throw error;

      toast({
        title: "Cold Calling Campaign Started! 🎉",
        description: `${monthlyCost} points deducted. Your ${selectedHours}-hour monthly campaign is now active.`,
      });

      setUserBalance(prev => prev - monthlyCost);
      setShowColdCallingModal(false);
      setSelectedHours(null);
      setConsultantName("");
      fetchUserCampaigns(); // Refresh campaigns list
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
        title: "Campaign Stopped",
        description: "Monthly billing has been stopped for this campaign.",
      });

      // Refresh campaigns
      fetchUserCampaigns();
    } catch (error) {
      console.error('Error stopping campaign:', error);
      toast({
        title: "Error",
        description: "Failed to stop campaign. Please try again.",
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
        title: "Campaign Reactivated", 
        description: "Monthly billing has been reactivated for this campaign.",
      });

      // Refresh campaigns
      fetchUserCampaigns();
    } catch (error) {
      console.error('Error reactivating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to reactivate campaign. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUserBalance();
    checkAdminStatus();
    fetchUserCampaigns();
  }, [user]);

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
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (data && data.role === 'admin') {
        setIsAdmin(true);
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

  const confirmCheckout = async () => {
    if (!user || !selectedTarget || !budgetAmount || !consultantName) return;

    try {
      const monthlySpend = parseInt(budgetAmount);
      
      // Deduct points and create transaction
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ points_balance: userBalance - monthlySpend })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      const { error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          user_id: user.id,
          amount: -monthlySpend,
          type: 'purchase',
          description: `Facebook Ads Campaign - ${selectedTarget.name}`
        });

      if (transactionError) throw transactionError;

      // Create campaign entry
      const { data: fbCampaign, error: campaignError } = await supabase
        .from('lead_gen_campaigns')
        .upsert({
          name: `Facebook Ads - ${selectedTarget.name}`,
          description: `Facebook advertising campaign targeting ${selectedTarget.name}`,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          total_budget: monthlySpend * 12,
          status: 'active',
          created_by: user.id
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      const { error } = await supabase
        .from('campaign_participants')
        .insert({
          campaign_id: fbCampaign.id,
          user_id: user.id,
          consultant_name: consultantName,
          budget_contribution: monthlySpend
        });

      if (error) throw error;

      toast({
        title: "Campaign Started! 🎉",
        description: `${monthlySpend} points deducted. Your ${selectedTarget?.name} campaign is now live.`,
      });

      setUserBalance(prev => prev - monthlySpend);
      resetFlow();
      setShowCheckoutModal(false);
      fetchUserCampaigns(); // Refresh campaigns list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-20 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex justify-end items-center mb-6">
              {isAdmin && (
                <Button 
                  variant={adminMode ? "default" : "secondary"} 
                  size="sm"
                  onClick={() => setAdminMode(!adminMode)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {adminMode ? "Exit Admin Mode" : "Admin Mode"}
                </Button>
              )}
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

          {/* Active Campaigns Section */}
          {!adminMode && userCampaigns.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-8 text-center">Your Active Campaigns</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
                {userCampaigns.map((participation) => {
                  const campaign = participation.lead_gen_campaigns;
                  const isColdCalling = campaign.name.includes('Cold Calling');
                  const IconComponent = isColdCalling ? Phone : Target;
                  const iconColor = isColdCalling ? 'text-green-600' : 'text-blue-600';
                  const bgColor = isColdCalling ? 'bg-green-500/10' : 'bg-blue-500/10';
                  
                  return (
                    <Card key={participation.id} className="hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4 mb-6">
                          <div className={`${bgColor} p-3 rounded-lg flex-shrink-0`}>
                            <IconComponent className={`h-6 w-6 ${iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1">{campaign.name}</h3>
                            <p className="text-sm text-muted-foreground">{campaign.description}</p>
                          </div>
                          <Badge 
                            variant={campaign.status === 'active' ? 'default' : 'secondary'}
                            className="capitalize flex-shrink-0"
                          >
                            {campaign.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-3">
                            <Badge variant="outline" className="bg-primary/5">
                              ${participation.budget_contribution} Monthly
                            </Badge>
                            <Badge variant={
                              participation.billing_status === 'active' ? 'default' : 
                              participation.billing_status === 'stopped' ? 'destructive' : 'secondary'
                            }>
                              {participation.billing_status === 'active' ? 'Active Billing' :
                               participation.billing_status === 'stopped' ? 'Billing Stopped' :
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
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Stop Billing
                                </Button>
                              ) : participation.billing_status === 'stopped' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReactivateCampaign(participation.id)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  Reactivate
                                </Button>
                              ) : null}
                            </div>
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
            {/* Campaign Type Selection */}
            {currentStep === 'campaign-type' && (
              <div className="space-y-12">
                <div className="text-center max-w-3xl mx-auto">
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">Choose Your Campaign Type</h2>
                  <p className="text-xl text-muted-foreground">
                    Select the lead generation strategy that best fits your business goals and budget.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                  <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group border-2 hover:border-primary/20">
                    <CardContent className="p-8 text-center" onClick={() => setCurrentStep('audience-selection')}>
                      <div className="bg-blue-500/10 p-6 rounded-2xl mb-6 w-fit mx-auto group-hover:scale-110 transition-transform">
                        <Target className="h-12 w-12 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">Facebook Ad Campaigns</h3>
                      <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                        Launch targeted Facebook ad campaigns with proven templates designed for financial advisors in Singapore. Choose from specialized audiences and track performance.
                      </p>
                      <div className="space-y-3 mb-8">
                        <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                          ✓ Targeted audiences (NSF, Seniors, General Public)
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                          ✓ Proven ad templates with performance data
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                          ✓ Expected 15-30 leads per $1000 spent
                        </div>
                      </div>
                      <Button className="w-full" size="lg">
                        Start Facebook Campaign
                      </Button>
                    </CardContent>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group border-2 hover:border-primary/20"
                    onClick={() => setShowColdCallingModal(true)}
                  >
                    <CardContent className="p-8 text-center">
                      <div className="bg-green-500/10 p-6 rounded-2xl mb-6 w-fit mx-auto group-hover:scale-110 transition-transform">
                        <Phone className="h-12 w-12 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">Cold Calling Campaigns</h3>
                      <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                        Hire professional telemarketers to generate leads through direct outreach. More personal approach with higher conversion rates for qualified prospects.
                      </p>
                      <div className="space-y-3 mb-8">
                        <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                          ✓ Professional telemarketers at 6 points/hour
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                          ✓ Direct personal engagement with prospects
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                          ✓ Higher conversion rates on qualified leads
                        </div>
                      </div>
                      <Button 
                        className="w-full pointer-events-none" 
                        size="lg"
                      >
                        Start Cold Calling
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Audience Selection Step */}
            {currentStep === 'audience-selection' && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
                  <Button 
                    variant="outline" 
                    onClick={resetFlow}
                    className="flex items-center gap-2 w-fit"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Campaign Types
                  </Button>
                  <div className="flex-1">
                    <h2 className="text-2xl md:text-3xl font-bold">Choose Your Target Audience</h2>
                  </div>
                </div>
                
                <div className="text-center mb-10 max-w-3xl mx-auto">
                  <p className="text-lg text-muted-foreground">
                    Select the audience that best matches your ideal clients. Each audience has specialized campaign types and proven ad templates.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                  {campaignTargets.map((target) => {
                    const IconComponent = target.icon;
                    return (
                      <Card 
                        key={target.id} 
                        className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group border-2 hover:border-primary/20 h-full"
                        onClick={() => selectAudience(target)}
                      >
                        <CardContent className="p-6 text-center h-full flex flex-col">
                          <div className={`${target.bgColor} p-4 rounded-xl mb-6 w-fit mx-auto group-hover:scale-110 transition-transform`}>
                            <IconComponent className={`h-8 w-8 ${target.iconColor}`} />
                          </div>
                          <h3 className="text-xl font-bold mb-3">{target.name}</h3>
                          <p className="text-muted-foreground mb-6 text-sm leading-relaxed flex-1">
                            {target.description}
                          </p>
                          <div className="space-y-3 text-xs text-muted-foreground mb-6 bg-muted/30 p-4 rounded-lg">
                            <div className="flex justify-between">
                              <span>Budget:</span>
                              <span className="font-medium">${target.budgetRange.min} - ${target.budgetRange.max}/mo</span>
                            </div>
                            <div className="text-center pt-2 border-t border-border/50">
                              <span className="font-medium text-primary">Optimized for quality leads</span>
                            </div>
                          </div>
                          <Button className="w-full mt-auto" size="sm">
                            Select {target.name}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}



            {/* Budget and Launch Step */}
            {currentStep === 'budget-launch' && selectedTarget && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep('audience-selection')}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Audience Selection
                  </Button>
                  <h2 className="text-2xl font-bold">Set Budget & Launch Campaign</h2>
                </div>

                <div className="max-w-2xl mx-auto">
                  <Card>
                    <CardHeader>
                      <CardTitle>Campaign Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Target Audience:</strong> {selectedTarget.name}</div>
                        <div><strong>Campaign Type:</strong> Facebook Ads</div>
                      </div>
                      
                      <div className="space-y-4 mt-6">
                        <div>
                          <Label htmlFor="consultant-name">Your Name</Label>
                          <Input
                            id="consultant-name"
                            placeholder="Enter your full name"
                            value={consultantName}
                            onChange={(e) => setConsultantName(e.target.value)}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="budget">Monthly Budget (Points)</Label>
                          <Input
                            id="budget"
                            type="number"
                            placeholder={`Recommended: ${selectedTarget.budgetRange.recommended}`}
                            value={budgetAmount}
                            onChange={(e) => setBudgetAmount(e.target.value)}
                            min={selectedTarget.budgetRange.min}
                            max={selectedTarget.budgetRange.max}
                            required
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Range: {selectedTarget.budgetRange.min} - {selectedTarget.budgetRange.max} points/month
                          </p>
                        </div>

                        {budgetAmount && (
                          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                            <h4 className="font-semibold mb-2">Expected Results</h4>
                            <div className="space-y-1 text-sm">
                              <p><strong>Monthly Budget:</strong> {budgetAmount} points</p>
                              <p><strong>Target Audience:</strong> {selectedTarget.name}</p>
                              <p><strong>Campaign Duration:</strong> 30 days</p>
                            </div>
                          </div>
                        )}

                        <Button 
                          onClick={() => setShowCheckoutModal(true)}
                          className="w-full" 
                          size="lg"
                          disabled={!consultantName || !budgetAmount}
                        >
                          Launch Campaign
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
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
              Confirm Your Purchase
            </DialogTitle>
            <DialogDescription>
              Review your campaign details and confirm the payment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-muted/20 p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Campaign Type:</span>
                <span className="text-sm">Facebook Ads</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Target Audience:</span>
                <span className="text-sm">{selectedTarget?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Monthly Budget:</span>
                <span className="text-sm font-bold">{budgetAmount} points</span>
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Current Balance:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{userBalance.toLocaleString()} points</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setTopUpModalOpen(true)}
                    className="text-xs"
                  >
                    Top Up
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Amount to Deduct:</span>
                <span className="text-sm font-bold text-red-600">-{budgetAmount} points</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Balance After:</span>
                  <span className="text-lg font-bold text-primary">
                    {(userBalance - parseInt(budgetAmount || "0")).toLocaleString()} points
                  </span>
                </div>
              </div>
            </div>
          </div>

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
              disabled={userBalance < parseInt(budgetAmount || "0")}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Confirm & Start Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cold Calling Hours Selection Modal */}
      <Dialog open={showColdCallingModal} onOpenChange={(open) => {
        console.log('Cold calling modal state changed:', open);
        setShowColdCallingModal(open);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-600" />
              Choose Your Cold Calling Plan
            </DialogTitle>
            <DialogDescription>
              Select how many hours of professional cold calling you want per month. Our trained telemarketers will generate leads for your financial advisory business.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="consultant-name-cold">Your Name</Label>
              <Input
                id="consultant-name-cold"
                placeholder="Enter your full name"
                value={consultantName}
                onChange={(e) => setConsultantName(e.target.value)}
                required
              />
            </div>

            <div>
              <Label className="text-base font-medium mb-4 block">Select Monthly Hours</Label>
              <div className="grid grid-cols-2 gap-3">
                {[20, 40, 60, 80].map((hours) => {
                  const monthlyCost = hours * 6;
                  const isSelected = selectedHours === hours;
                  return (
                    <Card 
                      key={hours}
                      className={`cursor-pointer transition-all duration-200 hover:scale-105 select-none h-full w-full ${
                        isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'
                      }`}
                      onClick={() => {
                        console.log('Cold calling box clicked, hours:', hours);
                        setSelectedHours(hours);
                      }}
                    >
                      <CardContent className="p-4 text-center h-full flex flex-col justify-center">
                        <div className="text-2xl font-bold text-primary mb-1 select-none">{hours}h</div>
                        <div className="text-sm text-muted-foreground mb-2 select-none">per month</div>
                        <div className="text-lg font-semibold text-foreground select-none">{monthlyCost} points</div>
                        <div className="text-xs text-muted-foreground select-none">~{Math.round(hours * 2.5)} leads expected</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {selectedHours && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold mb-2 text-green-800 dark:text-green-300">Plan Summary</h4>
                <div className="space-y-1 text-sm text-green-700 dark:text-green-400">
                  <p><strong>Hours per month:</strong> {selectedHours}</p>
                  <p><strong>Monthly cost:</strong> {selectedHours * 6} points</p>
                  <p><strong>Expected leads:</strong> ~{Math.round(selectedHours * 2.5)} per month</p>
                  <p><strong>Cost per lead:</strong> ~{Math.round((selectedHours * 6) / (selectedHours * 2.5))} points</p>
                </div>
              </div>
            )}

            {selectedHours && userBalance < (selectedHours * 6) && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-red-700 dark:text-red-400 text-sm">
                  <strong>Insufficient balance:</strong> You need {selectedHours * 6} points but only have {userBalance} points. 
                  Please top up your wallet first.
                </p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setTopUpModalOpen(true)}
                  className="mt-2"
                >
                  Top Up Wallet
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowColdCallingModal(false);
                setSelectedHours(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setShowColdCallingModal(false);
                setShowColdCallingCheckoutModal(true);
              }}
              className="flex-1"
              disabled={!selectedHours || !consultantName || userBalance < (selectedHours * 6)}
            >
              <Phone className="h-4 w-4 mr-2" />
              Continue to Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cold Calling Checkout Confirmation Modal */}
      <Dialog open={showColdCallingCheckoutModal} onOpenChange={setShowColdCallingCheckoutModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-600" />
              Confirm Your Cold Calling Campaign
            </DialogTitle>
            <DialogDescription>
              Review your campaign details and confirm the payment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-muted/20 p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Campaign Type:</span>
                <span className="text-sm">Cold Calling</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Monthly Hours:</span>
                <span className="text-sm">{selectedHours}h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Expected Leads:</span>
                <span className="text-sm">~{selectedHours ? Math.round(selectedHours * 2.5) : 0} per month</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Monthly Cost:</span>
                <span className="text-sm font-bold">{selectedHours ? selectedHours * 6 : 0} points</span>
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Current Balance:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{userBalance.toLocaleString()} points</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setTopUpModalOpen(true)}
                    className="text-xs"
                  >
                    Top Up
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Amount to Deduct:</span>
                <span className="text-sm font-bold text-red-600">-{selectedHours ? selectedHours * 6 : 0} points</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Balance After:</span>
                  <span className="text-lg font-bold text-primary">
                    {(userBalance - (selectedHours ? selectedHours * 6 : 0)).toLocaleString()} points
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowColdCallingCheckoutModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                confirmColdCallingCheckout();
                setShowColdCallingCheckoutModal(false);
              }}
              className="flex-1"
              disabled={!selectedHours || userBalance < (selectedHours * 6)}
            >
              <Phone className="h-4 w-4 mr-2" />
              Confirm & Start Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TopUpModal 
        isOpen={topUpModalOpen}
        onClose={() => setTopUpModalOpen(false)}
        onSuccess={handleTopUpSuccess}
      />
    </div>
  );
};

export default LeadGenCampaigns;