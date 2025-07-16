import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Navigation } from "@/components/Navigation";
import { TrendingUp, DollarSign, Target, Users, Calendar, Plus, User, Baby, Heart, Shield, Gift, Edit3, Eye, Star, Phone, ArrowLeft, Zap } from "lucide-react";
import { ActiveCampaignCard } from "@/components/ActiveCampaignCard";
import { TopUpModal } from "@/components/TopUpModal";
import { ExpressCampaignTemplates } from "@/components/campaigns/ExpressCampaignTemplates";
import { SmartBudgetCalculator } from "@/components/campaigns/SmartBudgetCalculator";
import { MobileCampaignWizard } from "@/components/campaigns/MobileCampaignWizard";
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
    name: 'NSF Personnel',
    description: 'Target National Service personnel with financial planning services',
    icon: Shield,
    bgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-600'
  },
  {
    id: 'general',
    name: 'General Public',
    description: 'Broad targeting for general financial consulting services',
    icon: Users,
    bgColor: 'bg-green-500/10',
    iconColor: 'text-green-600'
  },
  {
    id: 'mothers',
    name: 'Mothers',
    description: 'Target mothers with family financial planning and protection',
    icon: Heart,
    bgColor: 'bg-pink-500/10',
    iconColor: 'text-pink-600'
  },
  {
    id: 'seniors',
    name: 'Seniors',
    description: 'Target seniors with retirement and estate planning services',
    icon: User,
    bgColor: 'bg-purple-500/10',
    iconColor: 'text-purple-600'
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
  general: [
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
  mothers: [
    {
      id: 'mothers-1',
      title: 'Protect Your Family\'s Future',
      description: 'Comprehensive family protection and savings plan designed specifically for working mothers.',
      imageUrl: adMothers1,
      offer: 'Free family protection review + Education savings guide',
      adCopy: "💝 Protecting What Matters Most\n\nAs a mother, your family's security is everything. Get a comprehensive protection plan that gives you peace of mind.\n\n✅ Family income protection\n✅ Children's education planning\n✅ Emergency fund strategies\n\nFree consultation for caring mothers!",
      cta: "Protect My Family",
      performance: { ctr: "5.2%", cpm: "$6.10", conversions: 41 }
    },
    {
      id: 'mothers-2',
      title: 'Smart Savings for Your Child\'s Education',
      description: 'Start planning for your child\'s future today with our education savings strategies.',
      imageUrl: adMothers1,
      offer: 'Free education planning toolkit + University savings calculator',
      adCopy: "🎓 Your Child's Education = Their Future\n\nStart saving smart for university costs. Our calculator shows exactly how much you need to save monthly.\n\n✅ Education inflation calculator\n✅ Best savings vehicles comparison\n✅ Government schemes guide\n\nEvery month counts - Start today!",
      cta: "Calculate Now",
      performance: { ctr: "4.8%", cpm: "$5.60", conversions: 35 }
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
  const [leadsReceived, setLeadsReceived] = useState("");
  const [conversions, setConversions] = useState("");
  const [revenue, setRevenue] = useState("");
  const [notes, setNotes] = useState("");
  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [userParticipations, setUserParticipations] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [selectedAds, setSelectedAds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(true); // Demo admin mode activated
  const [editingAd, setEditingAd] = useState(null);
  const [adMockups, setAdMockups] = useState(AD_MOCKUPS);
  const [adminMode, setAdminMode] = useState(true); // Demo admin mode activated
  const [campaignType, setCampaignType] = useState(null); // 'fb-ads' or 'cold-calling'
  const [coldCallHours, setColdCallHours] = useState("");
  const [coldCallConsultantName, setColdCallConsultantName] = useState("");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFbCampaigns, setActiveFbCampaigns] = useState([]);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);

  useEffect(() => {
    fetchActiveCampaigns();
    fetchUserParticipations();
    checkAdminStatus();
    fetchUserBalance();
    fetchActiveFbCampaigns();
    
    // Check for successful top-up
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('topup') === 'success') {
      const points = urlParams.get('points');
      if (points) {
        handleTopUpSuccess(parseInt(points));
      }
      // Clean up URL
      window.history.replaceState({}, '', '/lead-gen-campaigns');
    }
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

  const updateAdContent = (targetId: string, adId: string, updates: any) => {
    setAdMockups(prev => ({
      ...prev,
      [targetId]: prev[targetId].map(ad => 
        ad.id === adId 
          ? { ...ad, ...updates }
          : ad
      )
    }));
    
    toast({
      title: "Ad Updated",
      description: "Ad content has been successfully updated.",
    });
  };

  const AdminEditDialog = ({ ad, targetId, onClose }: any) => {
    const [title, setTitle] = useState(ad.title);
    const [description, setDescription] = useState(ad.description);
    const [offer, setOffer] = useState(ad.offer);
    const [adCopy, setAdCopy] = useState(ad.adCopy);
    const [cta, setCta] = useState(ad.cta);

    const handleSave = () => {
      updateAdContent(targetId, ad.id, {
        title,
        description,
        offer,
        adCopy,
        cta
      });
      onClose();
    };

    return (
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Edit Ad Content
          </DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label>Ad Title</Label>
              <Input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Special Offer</Label>
              <Textarea 
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                rows={2}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Ad Copy</Label>
              <Textarea 
                value={adCopy}
                onChange={(e) => setAdCopy(e.target.value)}
                rows={8}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Call to Action</Label>
              <Input 
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-lg font-semibold">Live Preview</Label>
              <div className="mt-4 p-4 border rounded-lg bg-muted/20">
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-muted-foreground mb-4">{description}</p>
                
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-3 rounded-lg mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-primary text-sm">Special Offer</span>
                  </div>
                  <p className="text-sm font-medium">{offer}</p>
                </div>
                
                <div className="bg-background p-3 rounded border mb-4">
                  <div className="text-sm whitespace-pre-line">{adCopy}</div>
                </div>
                
                <Button size="sm" className="w-full">
                  {cta}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1">
            <DollarSign className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    );
  };

  const fetchActiveCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_gen_campaigns')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserParticipations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('campaign_participants')
        .select(`
          *,
          lead_gen_campaigns (
            name,
            total_budget,
            start_date,
            end_date
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setUserParticipations(data || []);
    } catch (error) {
      console.error('Error fetching participations:', error);
    }
  };

  const handleJoinCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !budgetAmount || !selectedTarget) {
      console.log('Missing required data:', { user: !!user, budgetAmount, selectedTarget: !!selectedTarget });
      return;
    }

    try {
      // Get user's current balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('points_balance')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      setUserBalance(profile.points_balance);
      setShowCheckoutModal(true);
    } catch (error) {
      console.error('Error in handleJoinCampaign:', error);
      toast({
        title: "Error",
        description: "Failed to load account information. Please try again.",
        variant: "destructive",
      });
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
      setUserBalance(data?.points_balance || 0);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleTopUpSuccess = async (points: number) => {
    toast({
      title: "Top-up Successful! 🎉",
      description: `${points} points have been added to your wallet.`,
    });
    
    // Refresh user balance
    await fetchUserBalance();
  };

  const fetchActiveFbCampaigns = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('campaign_participants')
        .select(`
          *,
          lead_gen_campaigns (
            name,
            total_budget,
            start_date,
            end_date,
            status
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Filter for active Facebook ad campaigns
      const fbCampaigns = data?.filter(p => 
        p.lead_gen_campaigns?.status === 'active' && 
        p.consultant_name // Facebook campaigns have consultant names
      ) || [];
      
      setActiveFbCampaigns(fbCampaigns);
    } catch (error) {
      console.error('Error fetching FB campaigns:', error);
    }
  };

  const pauseCampaign = async (participationId: string) => {
    try {
      setIsProcessing(true);
      
      // Update campaign status to paused
      const { error } = await supabase
        .from('campaign_participants')
        .update({ notes: 'PAUSED' })
        .eq('id', participationId);

      if (error) throw error;

      toast({
        title: "Campaign Paused",
        description: "Your Facebook ads campaign has been paused. You won't be charged for the next month.",
      });

      fetchActiveFbCampaigns();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pause campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resumeCampaign = async (participationId: string) => {
    try {
      setIsProcessing(true);
      
      const { error } = await supabase
        .from('campaign_participants')
        .update({ notes: null })
        .eq('id', participationId);

      if (error) throw error;

      toast({
        title: "Campaign Resumed",
        description: "Your Facebook ads campaign has been resumed. Monthly charges will continue.",
      });

      fetchActiveFbCampaigns();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resume campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmCheckout = async () => {
    if (!user || !selectedTarget || !budgetAmount) {
      console.log('Missing required data for checkout:', { user: !!user, selectedTarget: !!selectedTarget, budgetAmount });
      return;
    }

    const monthlySpend = parseInt(budgetAmount);
    setIsProcessing(true);

    try {
      if (userBalance < monthlySpend) {
        toast({
          title: "Insufficient Points",
          description: `You need ${monthlySpend} points for the first month but only have ${userBalance}`,
          variant: "destructive",
        });
        setShowCheckoutModal(false);
        return;
      }

      // Deduct points for first month
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ points_balance: userBalance - monthlySpend })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Create points transaction record
      const { error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          user_id: user.id,
          amount: -monthlySpend,
          type: 'purchase',
          description: `Facebook ads monthly spend - ${selectedTarget?.name} (First month)`
        });

      if (transactionError) throw transactionError;

      // For Facebook ads, we'll create a simple campaign participation record
      // First, create or get a Facebook ads campaign entry
      const { data: fbCampaign, error: campaignError } = await supabase
        .from('lead_gen_campaigns')
        .upsert({
          name: `Facebook Ads - ${selectedTarget.name}`,
          description: `Facebook advertising campaign targeting ${selectedTarget.name}`,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          total_budget: monthlySpend * 12, // Yearly budget estimate
          status: 'active',
          created_by: user.id
        }, {
          onConflict: 'name'
        })
        .select()
        .single();

      if (campaignError) {
        console.error('Campaign creation error:', campaignError);
        throw campaignError;
      }

      const { error } = await supabase
        .from('campaign_participants')
        .insert({
          campaign_id: fbCampaign.id,
          user_id: user.id,
          consultant_name: consultantName,
          budget_contribution: monthlySpend
        });

      if (error) {
        console.error('Participant insertion error:', error);
        throw error;
      }

      toast({
        title: "Campaign Started! 🎉",
        description: `${monthlySpend} points deducted. Your ${selectedTarget?.name} campaign will charge ${monthlySpend} points monthly.`,
      });

      // Update the user balance state
      setUserBalance(prev => prev - monthlySpend);

      setBudgetAmount("");
      setConsultantName("");
      setSelectedCampaign(null);
      setSelectedTarget(null);
      setSelectedAds([]);
      setShowCheckoutModal(false);
      fetchUserParticipations();
      fetchActiveFbCampaigns();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
      setShowCheckoutModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResultsSubmit = async (e: React.FormEvent, participationId: string) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('campaign_participants')
        .update({
          leads_received: parseInt(leadsReceived),
          conversions: parseInt(conversions),
          revenue_generated: parseInt(revenue),
          notes: notes
        })
        .eq('id', participationId);

      if (error) throw error;

      toast({
        title: "Results Updated",
        description: "Your campaign results have been successfully recorded.",
      });

      setLeadsReceived("");
      setConversions("");
      setRevenue("");
      setNotes("");
      fetchUserParticipations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update results. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-between items-center mb-6">
              <div></div>
              {isAdmin && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Admin Mode</span>
                    <Button
                      variant={adminMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAdminMode(!adminMode)}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      {adminMode ? "Exit Edit Mode" : "Edit Ads"}
                    </Button>
                  </div>
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
            <div className="flex justify-center gap-4 mt-6">
              <Badge variant="secondary" className="text-sm">
                <Target className="h-3 w-3 mr-1" />
                Targeted Audiences
              </Badge>
              <Badge variant="secondary" className="text-sm">
                <Star className="h-3 w-3 mr-1" />
                Proven Ad Templates
              </Badge>
              <Badge variant="secondary" className="text-sm">
                <DollarSign className="h-3 w-3 mr-1" />
                Flexible Budgets
              </Badge>
            </div>
          </div>

          {!campaignType ? (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">Choose Your Campaign Type</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Select the lead generation strategy that best fits your business goals and budget.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                  <CardContent className="p-8 text-center" onClick={() => setCampaignType('fb-ads')}>
                    <div className="bg-blue-500/10 p-6 rounded-xl mb-6 w-fit mx-auto group-hover:scale-110 transition-transform">
                      <Target className="h-12 w-12 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">Facebook Ad Campaigns</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                      Launch targeted Facebook ad campaigns with proven templates designed for financial advisors in Singapore. Choose from specialized audiences and track performance.
                    </p>
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                        ✓ Targeted audiences (NSF, Seniors, Mothers, General)
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
                    <Button className="w-full" size="lg">
                      Start Cold Calling
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : campaignType === 'cold-calling' ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <Button 
                  variant="outline" 
                  onClick={() => setCampaignType(null)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Campaign Types
                </Button>
                <h2 className="text-2xl font-bold">Cold Calling Campaign Setup</h2>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    Telemarketing Campaign Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                   <form onSubmit={async (e) => {
                     e.preventDefault();
                     if (!user) return;

                     const hours = parseInt(coldCallHours);
                     if (hours < 10) {
                       toast({
                         title: "Error",
                         description: "Minimum 10 hours required",
                         variant: "destructive",
                       });
                       return;
                     }

                     const pointsCost = hours * 6; // 6 points per hour ($1 = 1 point, $6/hour)

                     try {
                       // Check if user has enough points
                       const { data: profile, error: profileError } = await supabase
                         .from('profiles')
                         .select('points_balance')
                         .eq('user_id', user?.id)
                         .single();

                       if (profileError) throw profileError;

                       if (profile.points_balance < pointsCost) {
                         toast({
                           title: "Insufficient Points",
                           description: `You need ${pointsCost} points but only have ${profile.points_balance}`,
                           variant: "destructive",
                         });
                         return;
                       }

                       // Deduct points and create campaign participant
                       const { error: updateError } = await supabase
                         .from('profiles')
                         .update({ points_balance: profile.points_balance - pointsCost })
                         .eq('user_id', user?.id);

                       if (updateError) throw updateError;

                       // Create points transaction record
                       const { error: transactionError } = await supabase
                         .from('points_transactions')
                         .insert({
                           user_id: user?.id,
                           amount: -pointsCost,
                           type: 'purchase',
                           description: `Cold calling campaign - ${hours} hours`
                         });

                       if (transactionError) throw transactionError;

                       toast({
                         title: "Campaign Started!",
                         description: `${pointsCost} points deducted. Your cold calling campaign is now active.`,
                       });
                       
                       // Reset form
                       setColdCallHours("");
                       setColdCallConsultantName("");
                     } catch (error) {
                       toast({
                         title: "Error",
                         description: "Failed to process payment. Please try again.",
                         variant: "destructive",
                       });
                     }
                   }} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="coldCallConsultantName">Your Name</Label>
                      <Input
                        id="coldCallConsultantName"
                        placeholder="Enter your full name"
                        value={coldCallConsultantName}
                        onChange={(e) => setColdCallConsultantName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="coldCallHours">Number of Telemarketing Hours</Label>
                      <Input
                        id="coldCallHours"
                        type="number"
                        placeholder="40"
                        value={coldCallHours}
                        onChange={(e) => setColdCallHours(e.target.value)}
                        required
                        min="1"
                      />
                        <p className="text-sm text-muted-foreground">
                          Cost: 6 points per hour (Minimum 10 hours). Professional telemarketers will contact prospects on your behalf during business hours.
                        </p>
                    </div>

                    {coldCallHours && (
                      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                        <h4 className="font-semibold mb-2">Campaign Summary</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Hours:</strong> {coldCallHours} hours</p>
                           <p><strong>Rate:</strong> 6 points per hour</p>
                            <p><strong>Total Cost:</strong> {parseInt(coldCallHours || "0") * 6} points</p>
                          <p><strong>Expected Calls:</strong> ~{parseInt(coldCallHours || "0") * 20} calls</p>
                          <p><strong>Expected Leads:</strong> ~{Math.round(parseInt(coldCallHours || "0") * 20 * 0.15)} qualified leads</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                        <Button type="submit" className="flex-1" size="lg" disabled={!coldCallHours || !coldCallConsultantName}>
                          <Phone className="h-5 w-5 mr-2" />
                          Pay with Points & Start Campaign
                        </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setCampaignType(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Tabs defaultValue="campaigns" className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <Button 
                  variant="outline" 
                  onClick={() => setCampaignType(null)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Campaign Types
                </Button>
                <h2 className="text-xl font-semibold">Facebook Ad Campaigns</h2>
              </div>
              
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="campaigns">Set Budget & Choose Ads</TabsTrigger>
                <TabsTrigger 
                  value="my-campaigns" 
                  onClick={() => {
                    fetchUserParticipations();
                    fetchActiveFbCampaigns();
                  }}
                >
                  My Active Budgets
                </TabsTrigger>
                <TabsTrigger value="results">Performance Tracking</TabsTrigger>
              </TabsList>

              <TabsContent value="campaigns" className="space-y-6">
                {/* Express Templates Section */}
                <div className="mb-8">
                  <ExpressCampaignTemplates 
                    onSelectTemplate={(template) => {
                      // Auto-fill campaign data based on template
                      setBudgetAmount(template.budget.toString());
                      setConsultantName("Quick Campaign");
                      // Find matching target
                      const matchingTarget = CAMPAIGN_TARGETS.find(t => 
                        t.name.toLowerCase().includes(template.targetAudience.toLowerCase().split(' ')[0])
                      );
                      if (matchingTarget) {
                        setSelectedTarget(matchingTarget);
                        // Auto-select first ad for this target
                        const firstAd = adMockups[matchingTarget.id]?.[0];
                        if (firstAd) {
                          setSelectedAds([firstAd.id]);
                        }
                      }
                    }}
                    userBalance={userBalance}
                  />
                </div>

                {/* Mobile Campaign Wizard for small screens */}
                <div className="block md:hidden mb-8">
                  <MobileCampaignWizard
                    onComplete={(campaignData) => {
                      toast({
                        title: "Campaign Launched!",
                        description: `Your ${campaignData.template?.name} campaign is now live.`,
                      });
                    }}
                    userBalance={userBalance}
                  />
                </div>

                {!selectedTarget ? (
                <div className="hidden md:block">
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-8 mb-8">
                    <h2 className="text-3xl font-bold mb-4">Choose Your Target Audience</h2>
                    <p className="text-lg text-muted-foreground mb-6">
                      Select the demographic you want to focus your financial advisory services on. Each audience has specially crafted ad campaigns designed to maximize engagement and conversions.
                    </p>
                    <Badge variant="secondary" className="mb-4">
                      <Zap className="h-3 w-3 mr-1" />
                      Or use Express Templates above for instant setup
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {CAMPAIGN_TARGETS.map((target) => {
                      const IconComponent = target.icon;
                      return (
                        <Card key={target.id} className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                          <CardContent className="p-8" onClick={() => setSelectedTarget(target)}>
                            <div className={`${target.bgColor} p-6 rounded-xl mb-6 w-fit group-hover:scale-110 transition-transform`}>
                              <IconComponent className={`h-10 w-10 ${target.iconColor}`} />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">{target.name}</h3>
                            <p className="text-muted-foreground text-lg leading-relaxed">{target.description}</p>
                            <div className="mt-6 flex items-center text-primary font-medium">
                              <span>View ad campaigns</span>
                              <Target className="h-4 w-4 ml-2" />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : !selectedAds.length ? (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedTarget(null)}
                      className="flex items-center gap-2"
                    >
                      ← Back to Targets
                    </Button>
                    <h2 className="text-2xl font-bold">Choose Your Ads - {selectedTarget.name}</h2>
                  </div>
                  
                  <div className="grid gap-8">
                    {adMockups[selectedTarget.id].map((ad) => (
                      <Card key={ad.id} className="overflow-hidden hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-0">
                          <div className="md:flex">
                            <div className="md:w-1/2">
                              <img 
                                src={ad.imageUrl} 
                                alt={ad.title}
                                className="w-full h-64 md:h-full object-cover"
                              />
                            </div>
                            <div className="md:w-1/2 p-8">
                              <div className="flex justify-between items-start mb-4">
                                <h3 className="text-2xl font-bold">{ad.title}</h3>
                                {adminMode && (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="secondary" size="sm">
                                        <Edit3 className="h-4 w-4 mr-2" />
                                        Edit
                                      </Button>
                                    </DialogTrigger>
                                    <AdminEditDialog 
                                      ad={ad} 
                                      targetId={selectedTarget.id}
                                      onClose={() => setEditingAd(null)}
                                    />
                                  </Dialog>
                                )}
                              </div>
                              
                              <p className="text-muted-foreground mb-4 text-lg">{ad.description}</p>
                              
                              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-lg mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                  <Gift className="h-5 w-5 text-primary" />
                                  <span className="font-semibold text-primary">Special Offer</span>
                                </div>
                                <p className="font-medium">{ad.offer}</p>
                              </div>
                              
                              <div className="bg-muted/30 p-4 rounded-lg mb-6">
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                  <Eye className="h-4 w-4" />
                                  Ad Preview
                                </h4>
                                <div className="text-sm whitespace-pre-line text-muted-foreground bg-background p-3 rounded border">
                                  {ad.adCopy}
                                </div>
                                <div className="mt-3">
                                  <Button size="sm" className="w-full">
                                    {ad.cta}
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-3 mb-6 text-center">
                                <div className="bg-green-500/10 p-3 rounded-lg">
                                  <div className="text-sm text-muted-foreground">CTR</div>
                                  <div className="font-bold text-green-600">{ad.performance.ctr}</div>
                                </div>
                                <div className="bg-blue-500/10 p-3 rounded-lg">
                                  <div className="text-sm text-muted-foreground">CPM</div>
                                  <div className="font-bold text-blue-600">{ad.performance.cpm}</div>
                                </div>
                                <div className="bg-purple-500/10 p-3 rounded-lg">
                                  <div className="text-sm text-muted-foreground">Leads</div>
                                  <div className="font-bold text-purple-600">{ad.performance.conversions}</div>
                                </div>
                              </div>
                              
                              <Button 
                                onClick={() => {
                                  if (selectedAds.includes(ad.id)) {
                                    setSelectedAds(selectedAds.filter(id => id !== ad.id));
                                  } else {
                                    setSelectedAds([...selectedAds, ad.id]);
                                  }
                                }}
                                variant={selectedAds.includes(ad.id) ? "default" : "outline"}
                                className="w-full"
                                size="lg"
                              >
                                {selectedAds.includes(ad.id) ? "✓ Selected for Campaign" : "Select This Ad"}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {selectedAds.length > 0 && (
                    <Card className="mt-8 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
                      <CardContent className="p-8">
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                          <Target className="h-6 w-6 text-primary" />
                          Campaign Summary ({selectedAds.length} ads selected)
                        </h3>
                        <div className="grid gap-4 mb-6">
                          {selectedAds.map((adId) => {
                            const ad = adMockups[selectedTarget.id].find(a => a.id === adId);
                            return (
                              <div key={adId} className="flex items-center justify-between bg-background/80 backdrop-blur p-4 rounded-lg border">
                                <div className="flex items-center gap-4">
                                  <div className="w-16 h-12 rounded overflow-hidden">
                                    <img src={ad?.imageUrl} alt={ad?.title} className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                    <span className="font-semibold">{ad?.title}</span>
                                    <div className="text-sm text-muted-foreground">
                                      Expected CTR: {ad?.performance.ctr} • CPM: {ad?.performance.cpm}
                                    </div>
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedAds(selectedAds.filter(id => id !== adId))}
                                  className="text-destructive hover:text-destructive"
                                >
                                  Remove
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                        <Button 
                          onClick={() => {
                            // Create a mock campaign for the budget step
                            setSelectedCampaign({
                              id: `${selectedTarget.id}-campaign`,
                              name: `${selectedTarget.name} Financial Planning Campaign`,
                              description: `Facebook ad campaign targeting ${selectedTarget.name.toLowerCase()} with selected financial services offers`
                            });
                          }}
                          className="w-full"
                          size="lg"
                        >
                          <DollarSign className="h-5 w-5 mr-2" />
                          Set Campaign Budget
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedAds([])}
                      className="flex items-center gap-2"
                    >
                      ← Back to Ads
                    </Button>
                    <h2 className="text-2xl font-bold">Allocate Your Marketing Budget</h2>
                  </div>
                  
                  {/* Smart Budget Calculator */}
                  <div className="mb-6">
                    <SmartBudgetCalculator
                      selectedTarget={selectedTarget?.id}
                      onBudgetChange={(budget) => setBudgetAmount(budget.toString())}
                      userBalance={userBalance}
                    />
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        Campaign Setup Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 mb-6">
                        <div>
                          <p className="text-sm text-muted-foreground">Target Audience</p>
                          <p className="font-medium">{selectedTarget.name}</p>
                        </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Selected Ads</p>
                            <div className="space-y-1">
                              {selectedAds.map((adId) => {
                                const ad = adMockups[selectedTarget.id].find(a => a.id === adId);
                                return <p key={adId} className="font-medium text-sm">• {ad?.title}</p>
                              })}
                            </div>
                          </div>
                      </div>
                      
                      <form onSubmit={handleJoinCampaign} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="consultantName">Your Name</Label>
                          <Input
                            id="consultantName"
                            placeholder="Enter your full name"
                            value={consultantName}
                            onChange={(e) => setConsultantName(e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="contribution">Monthly Ad Spend Budget</Label>
                          <Input
                            id="contribution"
                            type="number"
                            placeholder="500"
                            value={budgetAmount}
                            onChange={(e) => setBudgetAmount(e.target.value)}
                            required
                            min="1"
                          />
                          <p className="text-sm text-muted-foreground">
                            Monthly budget for Facebook ads targeting {selectedTarget.name.toLowerCase()}. $1 = 1 point. This amount will be deducted monthly from your points balance.
                          </p>
                          {budgetAmount && (
                            <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                              <p className="text-sm"><strong>Monthly Cost:</strong> {budgetAmount} points</p>
                              <p className="text-sm text-muted-foreground">Expected 15-30 leads per month at this budget level</p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button type="submit" className="flex-1" size="lg">
                            <DollarSign className="h-5 w-5 mr-2" />
                            Start Monthly Campaign
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setSelectedTarget(null);
                              setSelectedAds([]);
                            }}
                          >
                            Start Over
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="my-campaigns" className="space-y-6">
              {userParticipations.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Campaign Participations</h3>
                    <p className="text-muted-foreground">You haven't joined any campaigns yet. Check the Available Campaigns tab to get started.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {userParticipations.map((participation) => (
                    <Card key={participation.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{participation.lead_gen_campaigns.name}</span>
                          <Badge variant="secondary">
                            ${participation.budget_contribution.toLocaleString()} Contributed
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-primary">{participation.leads_received}</p>
                            <p className="text-sm text-muted-foreground">Leads</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-primary">{participation.conversions}</p>
                            <p className="text-sm text-muted-foreground">Conversions</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-primary">
                              {participation.conversions && participation.leads_received ? 
                                `${((participation.conversions / participation.leads_received) * 100).toFixed(1)}%` : 
                                "0%"
                              }
                            </p>
                            <p className="text-sm text-muted-foreground">Conv. Rate</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-primary">
                              ${participation.revenue_generated.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">Revenue</p>
                          </div>
                        </div>
                        {participation.notes && (
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-sm">{participation.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {userParticipations.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Campaign Data</h3>
                    <p className="text-muted-foreground">Join a campaign first to track your results.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {userParticipations.map((participation) => (
                    <Card key={participation.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          Update Results for "{participation.lead_gen_campaigns.name}"
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={(e) => handleResultsSubmit(e, participation.id)} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor={`leads-${participation.id}`}>Leads Received</Label>
                              <Input
                                id={`leads-${participation.id}`}
                                type="number"
                                placeholder={participation.leads_received?.toString() || "25"}
                                value={leadsReceived}
                                onChange={(e) => setLeadsReceived(e.target.value)}
                                required
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`conversions-${participation.id}`}>Conversions</Label>
                              <Input
                                id={`conversions-${participation.id}`}
                                type="number"
                                placeholder={participation.conversions?.toString() || "8"}
                                value={conversions}
                                onChange={(e) => setConversions(e.target.value)}
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`revenue-${participation.id}`}>Revenue Generated (SGD)</Label>
                              <Input
                                id={`revenue-${participation.id}`}
                                type="number"
                                placeholder={participation.revenue_generated?.toString() || "15000"}
                                value={revenue}
                                onChange={(e) => setRevenue(e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`notes-${participation.id}`}>Campaign Notes</Label>
                            <Textarea
                              id={`notes-${participation.id}`}
                              placeholder={participation.notes || "Performance insights, feedback, areas for improvement..."}
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              rows={4}
                            />
                          </div>

                          <Button type="submit" className="w-full">
                            Update Campaign Results
                          </Button>
                        </form>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                          <Card>
                            <CardContent className="p-4 text-center">
                              <Target className="h-6 w-6 text-primary mx-auto mb-2" />
                              <h4 className="font-semibold text-sm">Current Conv. Rate</h4>
                              <p className="text-xl font-bold text-primary">
                                {participation.conversions && participation.leads_received ? 
                                  `${((participation.conversions / participation.leads_received) * 100).toFixed(1)}%` : 
                                  "0%"
                                }
                              </p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-4 text-center">
                              <DollarSign className="h-6 w-6 text-primary mx-auto mb-2" />
                              <h4 className="font-semibold text-sm">Cost per Lead</h4>
                              <p className="text-xl font-bold text-primary">
                                {participation.leads_received ? 
                                  `$${(participation.budget_contribution / participation.leads_received).toFixed(0)}` : 
                                  "$0"
                                }
                              </p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-4 text-center">
                              <Users className="h-6 w-6 text-primary mx-auto mb-2" />
                              <h4 className="font-semibold text-sm">ROI</h4>
                              <p className="text-xl font-bold text-primary">
                                {participation.revenue_generated && participation.budget_contribution ? 
                                  `${((participation.revenue_generated / participation.budget_contribution) * 100).toFixed(0)}%` : 
                                  "0%"
                                }
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              </TabsContent>
            </Tabs>
          )}
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
            {/* Campaign Summary */}
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

            {/* Wallet Information */}
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

            {/* Important Notice */}
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> This amount will be deducted monthly for as long as your campaign is active. 
                You can cancel anytime from your campaign dashboard.
              </p>
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

      <TopUpModal 
        isOpen={topUpModalOpen}
        onClose={() => setTopUpModalOpen(false)}
      />
    </div>
  );
};

export default LeadGenCampaigns;