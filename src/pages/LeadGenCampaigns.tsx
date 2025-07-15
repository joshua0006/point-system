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
import { TrendingUp, DollarSign, Target, Users, Calendar, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
        title: "Successfully Joined Campaign",
        description: `You've joined "${selectedCampaign.name}" with a contribution of $${budgetAmount}.`,
      });

      setBudgetAmount("");
      setConsultantName("");
      setSelectedCampaign(null);
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
              {isLoading ? (
                <div className="text-center py-8">Loading campaigns...</div>
              ) : activeCampaigns.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Active Campaigns</h3>
                    <p className="text-muted-foreground">There are currently no active lead generation campaigns available.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {activeCampaigns.map((campaign) => (
                    <Card key={campaign.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Target className="h-5 w-5 text-primary" />
                              {campaign.name}
                            </CardTitle>
                            <p className="text-muted-foreground mt-1">{campaign.description}</p>
                          </div>
                          <Badge variant="secondary">
                            ${campaign.total_budget.toLocaleString()} Total Budget
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Start Date</p>
                            <p className="font-medium">{new Date(campaign.start_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">End Date</p>
                            <p className="font-medium">{new Date(campaign.end_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        {userParticipations.some(p => p.campaign_id === campaign.id) ? (
                          <Badge variant="outline">Already Joined</Badge>
                        ) : (
                          <Button 
                            onClick={() => setSelectedCampaign(campaign)}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Join Campaign
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {selectedCampaign && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Join "{selectedCampaign.name}"
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                        <Label htmlFor="contribution">Budget Contribution (SGD)</Label>
                        <Input
                          id="contribution"
                          type="number"
                          placeholder="2500"
                          value={budgetAmount}
                          onChange={(e) => setBudgetAmount(e.target.value)}
                          required
                        />
                        <p className="text-sm text-muted-foreground">
                          Enter how much you want to contribute to this campaign
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1">
                          Join Campaign
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setSelectedCampaign(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
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