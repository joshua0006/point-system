import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { TrendingUp, DollarSign, Target, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LeadGenCampaigns = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [budgetAmount, setBudgetAmount] = useState("");
  const [campaignGoals, setCampaignGoals] = useState("");
  const [leadsReceived, setLeadsReceived] = useState("");
  const [conversions, setConversions] = useState("");
  const [revenue, setRevenue] = useState("");
  const [notes, setNotes] = useState("");

  const handleBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with Supabase to save budget data
    toast({
      title: "Budget Set Successfully",
      description: `Your lead generation budget of $${budgetAmount} has been registered.`,
    });
    setBudgetAmount("");
    setCampaignGoals("");
  };

  const handleResultsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with Supabase to save results data
    toast({
      title: "Results Recorded",
      description: "Your campaign results have been successfully recorded.",
    });
    setLeadsReceived("");
    setConversions("");
    setRevenue("");
    setNotes("");
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
              Set your marketing budget and track campaign performance to optimize your lead generation ROI.
            </p>
          </div>

          <Tabs defaultValue="budget" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="budget">Set Budget</TabsTrigger>
              <TabsTrigger value="results">Track Results</TabsTrigger>
            </TabsList>

            <TabsContent value="budget" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Campaign Budget Registration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBudgetSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="budget">Monthly Budget (SGD)</Label>
                        <Input
                          id="budget"
                          type="number"
                          placeholder="5000"
                          value={budgetAmount}
                          onChange={(e) => setBudgetAmount(e.target.value)}
                          required
                        />
                        <p className="text-sm text-muted-foreground">
                          Enter your monthly lead generation budget
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="goals">Campaign Goals</Label>
                        <Textarea
                          id="goals"
                          placeholder="Target 50 qualified leads per month..."
                          value={campaignGoals}
                          onChange={(e) => setCampaignGoals(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">What's Included:</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Multi-channel lead generation campaigns</li>
                        <li>• Lead qualification and scoring</li>
                        <li>• CRM integration and lead nurturing</li>
                        <li>• Performance analytics and reporting</li>
                        <li>• Campaign optimization and A/B testing</li>
                      </ul>
                    </div>

                    <Button type="submit" className="w-full">
                      Register Campaign Budget
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Campaign Results Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleResultsSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="leads">Leads Received</Label>
                        <Input
                          id="leads"
                          type="number"
                          placeholder="25"
                          value={leadsReceived}
                          onChange={(e) => setLeadsReceived(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="conversions">Conversions</Label>
                        <Input
                          id="conversions"
                          type="number"
                          placeholder="8"
                          value={conversions}
                          onChange={(e) => setConversions(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="revenue">Revenue Generated (SGD)</Label>
                        <Input
                          id="revenue"
                          type="number"
                          placeholder="15000"
                          value={revenue}
                          onChange={(e) => setRevenue(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Campaign Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Performance insights, feedback, areas for improvement..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Record Campaign Results
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h3 className="font-semibold">Conversion Rate</h3>
                    <p className="text-2xl font-bold text-primary">
                      {conversions && leadsReceived ? 
                        `${((Number(conversions) / Number(leadsReceived)) * 100).toFixed(1)}%` : 
                        "0%"
                      }
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h3 className="font-semibold">Cost per Lead</h3>
                    <p className="text-2xl font-bold text-primary">
                      {budgetAmount && leadsReceived ? 
                        `$${(Number(budgetAmount) / Number(leadsReceived)).toFixed(0)}` : 
                        "$0"
                      }
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h3 className="font-semibold">ROI</h3>
                    <p className="text-2xl font-bold text-primary">
                      {revenue && budgetAmount ? 
                        `${((Number(revenue) / Number(budgetAmount)) * 100).toFixed(0)}%` : 
                        "0%"
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LeadGenCampaigns;