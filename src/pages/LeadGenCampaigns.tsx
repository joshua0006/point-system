import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { TrendingUp, DollarSign, Target, Users, Calendar, Plus, User, Baby, Heart, Shield, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
      description: 'Get a complimentary financial consultation during your service period',
      imageUrl: '/placeholder.svg',
      offer: 'Free 60-min consultation + Financial planning toolkit'
    },
    {
      id: 'nsf-2',
      title: 'Start Your Wealth Journey Early',
      description: 'Learn investment basics while serving Singapore',
      imageUrl: '/placeholder.svg',
      offer: 'Free investment workshop + Starter portfolio guide'
    }
  ],
  general: [
    {
      id: 'general-1',
      title: 'Free Retirement Planning Workshop',
      description: 'Learn how to secure your financial future',
      imageUrl: '/placeholder.svg',
      offer: 'Free workshop + Retirement planning checklist'
    },
    {
      id: 'general-2',
      title: 'Maximize Your CPF Returns',
      description: 'Discover strategies to grow your CPF savings',
      imageUrl: '/placeholder.svg',
      offer: 'Free CPF optimization guide + 30-min consultation'
    }
  ],
  mothers: [
    {
      id: 'mothers-1',
      title: 'Protect Your Family\'s Future',
      description: 'Comprehensive family protection and savings plan',
      imageUrl: '/placeholder.svg',
      offer: 'Free family protection review + Education savings guide'
    },
    {
      id: 'mothers-2',
      title: 'Smart Savings for Your Child\'s Education',
      description: 'Start planning for your child\'s future today',
      imageUrl: '/placeholder.svg',
      offer: 'Free education planning toolkit + University savings calculator'
    }
  ],
  seniors: [
    {
      id: 'seniors-1',
      title: 'Secure Your Golden Years',
      description: 'Estate planning and legacy preservation services',
      imageUrl: '/placeholder.svg',
      offer: 'Free will writing consultation + Estate planning guide'
    },
    {
      id: 'seniors-2',
      title: 'Healthcare Cost Protection',
      description: 'Prepare for medical expenses in retirement',
      imageUrl: '/placeholder.svg',
      offer: 'Free healthcare planning session + Medical cost calculator'
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

  useEffect(() => {
    fetchActiveCampaigns();
    fetchUserParticipations();
  }, [user]);

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
    if (!selectedCampaign || !user) return;

    try {
      const { error } = await supabase
        .from('campaign_participants')
        .insert({
          campaign_id: selectedCampaign.id,
          user_id: user.id,
          consultant_name: consultantName,
          budget_contribution: parseInt(budgetAmount)
        });

      if (error) throw error;

      toast({
        title: "Campaign Launched Successfully!",
        description: `Your ${selectedTarget?.name} campaign has been launched with a budget of $${budgetAmount}. Facebook ads are now running with your selected offers.`,
      });

      setBudgetAmount("");
      setConsultantName("");
      setSelectedCampaign(null);
      setSelectedTarget(null);
      setSelectedAds([]);
      fetchUserParticipations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join campaign. Please try again.",
        variant: "destructive",
      });
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
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Lead Generation Campaign Management
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join active campaigns and track your lead generation performance to optimize your ROI.
            </p>
          </div>

          <Tabs defaultValue="campaigns" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="campaigns">Available Campaigns</TabsTrigger>
              <TabsTrigger value="my-campaigns">My Campaigns</TabsTrigger>
              <TabsTrigger value="results">Track Results</TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns" className="space-y-6">
              {!selectedTarget ? (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Choose Your Target Audience</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {CAMPAIGN_TARGETS.map((target) => {
                      const IconComponent = target.icon;
                      return (
                        <Card key={target.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                          <CardContent className="p-6" onClick={() => setSelectedTarget(target)}>
                            <div className={`${target.bgColor} p-4 rounded-lg mb-4 w-fit`}>
                              <IconComponent className={`h-8 w-8 ${target.iconColor}`} />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{target.name}</h3>
                            <p className="text-muted-foreground">{target.description}</p>
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
                  
                  <div className="grid gap-6">
                    {AD_MOCKUPS[selectedTarget.id].map((ad) => (
                      <Card key={ad.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex gap-6">
                            <div className="w-32 h-24 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                              <Gift className="h-8 w-8" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold mb-2">{ad.title}</h3>
                              <p className="text-muted-foreground mb-3">{ad.description}</p>
                              <div className="bg-primary/10 p-3 rounded-lg mb-4">
                                <p className="text-sm font-medium text-primary">{ad.offer}</p>
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
                              >
                                {selectedAds.includes(ad.id) ? "Selected" : "Select This Ad"}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {selectedAds.length > 0 && (
                    <Card className="mt-6">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Selected Ads ({selectedAds.length})</h3>
                        <div className="space-y-2 mb-4">
                          {selectedAds.map((adId) => {
                            const ad = AD_MOCKUPS[selectedTarget.id].find(a => a.id === adId);
                            return (
                              <div key={adId} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                                <span className="font-medium">{ad?.title}</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedAds(selectedAds.filter(id => id !== adId))}
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
                        >
                          Proceed to Budget Setting
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
                    <h2 className="text-2xl font-bold">Set Your Campaign Budget</h2>
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
                              const ad = AD_MOCKUPS[selectedTarget.id].find(a => a.id === adId);
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
                          <Label htmlFor="contribution">Campaign Budget (SGD)</Label>
                          <Input
                            id="contribution"
                            type="number"
                            placeholder="2500"
                            value={budgetAmount}
                            onChange={(e) => setBudgetAmount(e.target.value)}
                            required
                          />
                          <p className="text-sm text-muted-foreground">
                            This budget will be used to run your selected Facebook ads targeting {selectedTarget.name.toLowerCase()}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button type="submit" className="flex-1">
                            Launch Campaign
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
        </div>
      </div>
    </div>
  );
};

export default LeadGenCampaigns;