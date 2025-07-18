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
import adNsf1 from "@/assets/ad-nsf-1.jpg";
import adMothers1 from "@/assets/ad-mothers-1.jpg";
import adSeniors1 from "@/assets/ad-seniors-1.jpg";
import adGeneral1 from "@/assets/ad-general-1.jpg";

// Campaign targeting options
const CAMPAIGN_TARGETS = [
  {
    id: 'nsf',
    name: 'NSFs',
    description: 'Target National Service personnel with financial planning services',
    icon: Shield,
    bgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-600',
    campaignTypes: ['Financial Planning Basics', 'Investment Fundamentals', 'Savings Strategies', 'Insurance Basics'],
    campaignTypeCPL: {
      'Financial Planning Basics': 20,
      'Investment Fundamentals': 25,
      'Savings Strategies': 18,
      'Insurance Basics': 22
    } as Record<string, number>,
    budgetRange: {
      min: 200,
      max: 1500,
      recommended: 500
    },
    costPerLead: {
      min: 15,
      max: 35,
      average: 25
    },
    expectedLeads: {
      lowBudget: '8-15 leads/month',
      medBudget: '20-35 leads/month', 
      highBudget: '40-70 leads/month'
    }
  },
  {
    id: 'public',
    name: 'General Public',
    description: 'General public seeking comprehensive financial services',
    icon: Users,
    bgColor: 'bg-green-500/10',
    iconColor: 'text-green-600',
    campaignTypes: ['Retirement Planning', 'CPF Optimization', 'Investment Portfolio', 'Estate Planning', 'Tax Planning'],
    campaignTypeCPL: {
      'Retirement Planning': 35,
      'CPF Optimization': 30,
      'Investment Portfolio': 40,
      'Estate Planning': 45,
      'Tax Planning': 32
    } as Record<string, number>,
    budgetRange: {
      min: 300,
      max: 2500,
      recommended: 800
    },
    costPerLead: {
      min: 20,
      max: 50,
      average: 35
    },
    expectedLeads: {
      lowBudget: '6-12 leads/month',
      medBudget: '15-25 leads/month',
      highBudget: '30-55 leads/month'
    }
  },
  {
    id: 'seniors',
    name: 'Seniors',
    description: 'Target seniors with retirement and estate planning services',
    icon: User,
    bgColor: 'bg-purple-500/10',
    iconColor: 'text-purple-600',
    campaignTypes: ['Legacy Planning', 'Healthcare Protection', 'Estate Distribution', 'Long-term Care'],
    campaignTypeCPL: {
      'Legacy Planning': 55,
      'Healthcare Protection': 50,
      'Estate Distribution': 60,
      'Long-term Care': 45
    } as Record<string, number>,
    budgetRange: {
      min: 400,
      max: 3000,
      recommended: 1000
    },
    costPerLead: {
      min: 30,
      max: 70,
      average: 50
    },
    expectedLeads: {
      lowBudget: '5-10 leads/month',
      medBudget: '12-20 leads/month',
      highBudget: '25-40 leads/month'
    }
  }
];

// Ad mockups for each target
const AD_MOCKUPS = {
  nsf: [
    {
      id: 'nsf-1',
      title: 'Free Financial Health Check for NSF Personnel',
      description: 'Get a complimentary financial consultation during your service period. Perfect for young servicemen starting their financial journey.',
      imageUrl: adNsf1,
      offer: 'Free 60-min consultation + Financial planning toolkit',
      adCopy: "🛡️ Serving Singapore? Secure Your Future Too!\n\nGet expert financial advice tailored for NSF personnel. Start building wealth while you serve.\n\n✅ Free 60-minute consultation\n✅ Personalized financial roadmap\n✅ Investment basics workshop\n\nBook now - Limited spots available!",
      cta: "Claim Your Free Session",
      performance: { ctr: "3.2%", cpm: "$4.50", conversions: 24 }
    },
    {
      id: 'nsf-2',
      title: 'Start Your Wealth Journey Early',
      description: 'Learn investment basics while serving Singapore. Build financial literacy that lasts a lifetime.',
      imageUrl: adNsf1,
      offer: 'Free investment workshop + Starter portfolio guide',
      adCopy: "💰 Young & Ready to Invest?\n\nLearn the fundamentals of wealth building during your NS. Get ahead of your peers with smart financial planning.\n\n✅ Investment basics workshop\n✅ Risk assessment guide\n✅ Long-term planning strategies\n\nLimited time offer for NSF personnel!",
      cta: "Start Learning Today",
      performance: { ctr: "2.8%", cpm: "$3.90", conversions: 18 }
    }
  ],
  public: [
    {
      id: 'general-1',
      title: 'Free Retirement Planning Workshop',
      description: 'Learn how to secure your financial future with comprehensive retirement strategies.',
      imageUrl: adGeneral1,
      offer: 'Free workshop + Retirement planning checklist',
      adCopy: "🏆 Ready to Retire Comfortably?\n\nJoin our exclusive workshop and learn proven strategies to build your retirement nest egg.\n\n✅ CPF optimization techniques\n✅ Investment portfolio planning\n✅ Risk management strategies\n\nSpaces filling up fast - Register today!",
      cta: "Reserve Your Seat",
      performance: { ctr: "4.1%", cpm: "$5.20", conversions: 32 }
    },
    {
      id: 'general-2',
      title: 'Maximize Your CPF Returns',
      description: 'Discover strategies to grow your CPF savings and optimize your retirement funds.',
      imageUrl: adGeneral1,
      offer: 'Free CPF optimization guide + 30-min consultation',
      adCopy: "📈 Boost Your CPF Returns by 40%!\n\nDiscover little-known strategies to maximize your CPF growth. Our experts reveal the secrets.\n\n✅ CPF optimization strategies\n✅ Top-up timing guidance\n✅ Investment scheme options\n\nFree guide worth $200 - Download now!",
      cta: "Get Free Guide",
      performance: { ctr: "3.7%", cpm: "$4.80", conversions: 28 }
    }
  ],
  seniors: [
    {
      id: 'seniors-1',
      title: 'Secure Your Golden Years',
      description: 'Estate planning and legacy preservation services for retirees and pre-retirees.',
      imageUrl: adSeniors1,
      offer: 'Free will writing consultation + Estate planning guide',
      adCopy: "🌟 Your Legacy Matters\n\nEnsure your hard-earned assets are protected and passed on according to your wishes. Expert guidance for peace of mind.\n\n✅ Will writing assistance\n✅ Estate tax planning\n✅ Asset protection strategies\n\nSecure your family's future today!",
      cta: "Plan My Legacy",
      performance: { ctr: "3.9%", cpm: "$7.20", conversions: 22 }
    },
    {
      id: 'seniors-2',
      title: 'Healthcare Cost Protection',
      description: 'Prepare for medical expenses in retirement with comprehensive healthcare planning.',
      imageUrl: adSeniors1,
      offer: 'Free healthcare planning session + Medical cost calculator',
      adCopy: "🏥 Healthcare Costs Rising?\n\nProtect yourself from unexpected medical bills in retirement. Plan ahead with our comprehensive healthcare strategies.\n\n✅ Medisave optimization\n✅ Insurance gap analysis\n✅ Long-term care planning\n\nDon't let medical bills drain your savings!",
      cta: "Get Protected",
      performance: { ctr: "4.3%", cpm: "$6.80", conversions: 29 }
    }
  ]
};

const LeadGenCampaigns = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [budgetAmount, setBudgetAmount] = useState("");
  const [consultantName, setConsultantName] = useState("");
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [selectedAds, setSelectedAds] = useState([]);
  const [isAdmin, setIsAdmin] = useState(true);
  const [campaignTargets, setCampaignTargets] = useState(CAMPAIGN_TARGETS);
  const [adMockups, setAdMockups] = useState(AD_MOCKUPS);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  
  // New flow state management
  const [currentStep, setCurrentStep] = useState('campaign-type');
  const [campaignType, setCampaignType] = useState(null);
  const [selectedCampaignType, setSelectedCampaignType] = useState(null);
  
  // Admin mode state
  const [adminMode, setAdminMode] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [editingAd, setEditingAd] = useState(null);
  const [showTargetDialog, setShowTargetDialog] = useState(false);
  const [showAdDialog, setShowAdDialog] = useState(false);
  
  // Cold calling state
  const [showColdCallingModal, setShowColdCallingModal] = useState(false);
  const [selectedHours, setSelectedHours] = useState<number | null>(null);
  
  // Flow navigation functions
  const startFacebookCampaign = () => {
    setCampaignType('fb-ads');
    setCurrentStep('audience-selection');
  };
  
  const selectAudience = (target) => {
    setSelectedTarget(target);
    setCurrentStep('campaign-type-selection');
  };
  
  const selectCampaignTypeFromAudience = (campaignType) => {
    setSelectedCampaignType(campaignType);
    setCurrentStep('ad-selection');
  };
  
  const proceedToBudgetLaunch = () => {
    setCurrentStep('budget-launch');
  };
  
  const resetFlow = () => {
    setCampaignType(null);
    setSelectedTarget(null);
    setSelectedCampaignType(null);
    setSelectedAds([]);
    setCurrentStep('campaign-type');
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUserBalance();
    checkAdminStatus();
  }, [user]);

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
          description: `Facebook Ads Campaign - ${selectedTarget.name} - ${selectedCampaignType}`
        });

      if (transactionError) throw transactionError;

      // Create campaign entry
      const { data: fbCampaign, error: campaignError } = await supabase
        .from('lead_gen_campaigns')
        .upsert({
          name: `Facebook Ads - ${selectedTarget.name} - ${selectedCampaignType}`,
          description: `Facebook advertising campaign targeting ${selectedTarget.name} for ${selectedCampaignType}`,
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
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex justify-between items-center mb-6">
                <div></div>
                {isAdmin && (
                  <div className="flex items-center gap-4">
                    <Button 
                      variant={adminMode ? "default" : "secondary"} 
                      size="sm"
                      onClick={() => setAdminMode(!adminMode)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {adminMode ? "Exit Admin Mode" : "Admin Mode"}
                    </Button>
                  </div>
                )}
              </div>
          
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Financial Advisory Lead Generation
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose your lead generation strategy to grow your financial consulting business in Singapore.
              </p>
              
              {/* Wallet Balance Display */}
              <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-6 rounded-lg border border-primary/20 mt-6 mb-6 max-w-md mx-auto">
                <div className="text-center">
                  <h2 className="text-lg font-semibold mb-2">Your Campaign Wallet</h2>
                  <p className="text-2xl font-bold text-primary mb-2">{userBalance.toLocaleString()} points</p>
                  <p className="text-sm text-muted-foreground mb-3">Available for campaigns</p>
                  <Button 
                    onClick={() => setTopUpModalOpen(true)}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                  >
                    Top Up Wallet
                  </Button>
                </div>
              </div>
            </div>

            {/* Admin Mode Interface */}
            {adminMode ? (
              <AdminInterface 
                campaignTargets={campaignTargets}
                setCampaignTargets={setCampaignTargets}
                adMockups={adMockups}
                setAdMockups={setAdMockups}
                editingTarget={editingTarget}
                setEditingTarget={setEditingTarget}
                editingAd={editingAd}
                setEditingAd={setEditingAd}
                showTargetDialog={showTargetDialog}
                setShowTargetDialog={setShowTargetDialog}
                showAdDialog={showAdDialog}
                setShowAdDialog={setShowAdDialog}
              />
            ) : (
              <>
                {/* New Streamlined Flow */}
                {currentStep === 'campaign-type' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-4">Choose Your Campaign Type</h2>
                  <p className="text-lg text-muted-foreground mb-8">
                    Select the lead generation strategy that best fits your business goals and budget.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                    <CardContent className="p-8 text-center" onClick={startFacebookCampaign}>
                      <div className="bg-blue-500/10 p-6 rounded-xl mb-6 w-fit mx-auto group-hover:scale-110 transition-transform">
                        <Target className="h-12 w-12 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">Facebook Ad Campaigns</h3>
                      <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                        Launch targeted Facebook ad campaigns with proven templates designed for financial advisors in Singapore. Choose from specialized audiences and track performance.
                      </p>
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                          ✓ Targeted audiences (NSF, Seniors, General Public)
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                          ✓ Proven ad templates with performance data
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                          ✓ Expected 15-30 leads per $1000 spent
                        </div>
                      </div>
                      <Button className="w-full" size="lg">
                        Start Facebook Campaign
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                    <CardContent className="p-8 text-center" onClick={() => setCampaignType('cold-calling')}>
                      <div className="bg-green-500/10 p-6 rounded-xl mb-6 w-fit mx-auto group-hover:scale-110 transition-transform">
                        <Phone className="h-12 w-12 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">Cold Calling Campaigns</h3>
                      <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                        Hire professional telemarketers to generate leads through direct outreach. More personal approach with higher conversion rates for qualified prospects.
                      </p>
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                          ✓ Professional telemarketers at 6 points/hour
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                          ✓ Direct personal engagement with prospects
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                          ✓ Higher conversion rates on qualified leads
                        </div>
                      </div>
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={() => setShowColdCallingModal(true)}
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
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <Button 
                    variant="outline" 
                    onClick={resetFlow}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Campaign Types
                  </Button>
                  <h2 className="text-2xl font-bold">Choose Your Target Audience</h2>
                </div>
                
                <div className="text-center mb-8">
                  <p className="text-lg text-muted-foreground">
                    Select the audience that best matches your ideal clients. Each audience has specialized campaign types and proven ad templates.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                  {campaignTargets.map((target) => {
                    const IconComponent = target.icon;
                    return (
                      <Card 
                        key={target.id} 
                        className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 group"
                        onClick={() => selectAudience(target)}
                      >
                        <CardContent className="p-6 text-center">
                          <div className={`${target.bgColor} p-4 rounded-xl mb-4 w-fit mx-auto group-hover:scale-110 transition-transform`}>
                            <IconComponent className={`h-8 w-8 ${target.iconColor}`} />
                          </div>
                          <h3 className="text-xl font-bold mb-3">{target.name}</h3>
                          <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                            {target.description}
                          </p>
                          <div className="space-y-2 text-xs text-muted-foreground">
                            <div>Budget: ${target.budgetRange.min} - ${target.budgetRange.max}/month</div>
                            <div>Cost per lead: ${target.costPerLead.min} - ${target.costPerLead.max}</div>
                            <div>{target.campaignTypes.length} campaign types available</div>
                          </div>
                          <Button className="w-full mt-4" size="sm">
                            Select {target.name}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Campaign Type Selection Step */}
            {currentStep === 'campaign-type-selection' && selectedTarget && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep('audience-selection')}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Audiences
                  </Button>
                  <h2 className="text-2xl font-bold">Choose Campaign Type for {selectedTarget.name}</h2>
                </div>
                
                <div className="text-center mb-8">
                  <p className="text-lg text-muted-foreground">
                    Select the specific campaign focus that aligns with your expertise and target market.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {selectedTarget.campaignTypes.map((campaignType) => {
                    const cpl = selectedTarget.campaignTypeCPL[campaignType] || 25;
                    return (
                      <Card 
                        key={campaignType} 
                        className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 group"
                        onClick={() => selectCampaignTypeFromAudience(campaignType)}
                      >
                        <CardContent className="p-6">
                          <div className="text-center">
                            <h3 className="text-lg font-bold mb-3">{campaignType}</h3>
                            <div className="space-y-2 text-sm text-muted-foreground mb-4">
                              <div>Cost per lead: <span className="font-semibold text-primary">${cpl}</span></div>
                              <div>Target audience: <span className="font-semibold">{selectedTarget.name}</span></div>
                            </div>
                            <Button className="w-full" size="sm">
                              Select {campaignType}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ad Selection Step */}
            {currentStep === 'ad-selection' && selectedTarget && selectedCampaignType && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep('campaign-type-selection')}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Campaign Types
                  </Button>
                  <h2 className="text-2xl font-bold">Choose Your Ads - {selectedCampaignType}</h2>
                </div>
                
                <div className="text-center mb-8">
                  <p className="text-lg text-muted-foreground">
                    Select from our proven ad templates for {selectedTarget.name} targeting {selectedCampaignType}.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {(adMockups[selectedTarget.id] || []).map((ad) => (
                    <Card 
                      key={ad.id} 
                      className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                        selectedAds.includes(ad.id) ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-xl'
                      }`}
                      onClick={() => {
                        setSelectedAds(prev => 
                          prev.includes(ad.id) 
                            ? prev.filter(id => id !== ad.id)
                            : [...prev, ad.id]
                        );
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                          <img 
                            src={ad.imageUrl} 
                            alt={ad.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="text-lg font-bold mb-2">{ad.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{ad.description}</p>
                        <div className="text-xs space-y-1 mb-3">
                          <div><strong>CTR:</strong> {ad.performance.ctr}</div>
                          <div><strong>CPM:</strong> {ad.performance.cpm}</div>
                          <div><strong>Conversions:</strong> {ad.performance.conversions}</div>
                        </div>
                        <Badge variant={selectedAds.includes(ad.id) ? "default" : "secondary"} className="w-full justify-center">
                          {selectedAds.includes(ad.id) ? "Selected" : "Select Ad"}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedAds.length > 0 && (
                  <div className="text-center mt-8">
                    <Button onClick={proceedToBudgetLaunch} size="lg" className="px-8">
                      Proceed to Budget & Launch ({selectedAds.length} ads selected)
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Budget and Launch Step */}
            {currentStep === 'budget-launch' && selectedTarget && selectedCampaignType && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep('ad-selection')}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Ad Selection
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
                        <div><strong>Campaign Type:</strong> {selectedCampaignType}</div>
                        <div><strong>Ads Selected:</strong> {selectedAds.length}</div>
                        <div><strong>Expected CPL:</strong> ${selectedTarget.campaignTypeCPL[selectedCampaignType] || 25}</div>
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
                              <p><strong>Expected Leads:</strong> ~{Math.round(parseInt(budgetAmount) / (selectedTarget.campaignTypeCPL[selectedCampaignType] || 25))} leads/month</p>
                              <p><strong>Cost Per Lead:</strong> ${selectedTarget.campaignTypeCPL[selectedCampaignType] || 25}</p>
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
      <Dialog open={showColdCallingModal} onOpenChange={setShowColdCallingModal}>
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
              onClick={confirmColdCallingCheckout}
              className="flex-1"
              disabled={!selectedHours || !consultantName || userBalance < (selectedHours * 6)}
            >
              <Phone className="h-4 w-4 mr-2" />
              Start Cold Calling Campaign
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