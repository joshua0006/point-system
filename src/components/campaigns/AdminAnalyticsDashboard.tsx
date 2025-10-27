import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, Users, DollarSign, Target, Phone } from '@/lib/icons';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const AdminAnalyticsDashboard = () => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
    fetchCampaignSummary();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_analytics')
        .select(`
          *,
          lead_gen_campaigns (
            name,
            status
          )
        `)
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;
      setAnalytics(data || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data.",
        variant: "destructive",
      });
    }
  };

  const fetchCampaignSummary = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_participants')
        .select(`
          *,
          lead_gen_campaigns (
            id,
            name,
            status
          )
        `);

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaign summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTopPerformingCampaigns = () => {
    return campaigns
      .filter(c => c.leads_received > 0)
      .sort((a, b) => (b.leads_received + b.conversions) - (a.leads_received + a.conversions))
      .slice(0, 5);
  };

  const getTotalMetrics = () => {
    const totals = campaigns.reduce((acc, campaign) => ({
      leads: acc.leads + (campaign.leads_received || 0),
      conversions: acc.conversions + (campaign.conversions || 0),
      revenue: acc.revenue + (campaign.revenue_generated || 0),
      spent: acc.spent + (campaign.budget_contribution || 0)
    }), { leads: 0, conversions: 0, revenue: 0, spent: 0 });

    return totals;
  };

  const getConversionRate = () => {
    const totals = getTotalMetrics();
    return totals.leads > 0 ? ((totals.conversions / totals.leads) * 100).toFixed(1) : '0.0';
  };

  const getChartData = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayAnalytics = analytics.filter(a => a.date === dateStr);
      const dailyTotals = dayAnalytics.reduce((acc, item) => ({
        leads: acc.leads + (item.leads_generated || 0),
        impressions: acc.impressions + (item.impressions || 0),
        clicks: acc.clicks + (item.clicks || 0),
        cost: acc.cost + (item.cost_spent || 0)
      }), { leads: 0, impressions: 0, clicks: 0, cost: 0 });

      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        leads: dailyTotals.leads,
        impressions: dailyTotals.impressions,
        clicks: dailyTotals.clicks,
        cost: dailyTotals.cost
      });
    }
    return last7Days;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Campaign Analytics</h2>
          <p className="text-lg text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  const totals = getTotalMetrics();
  const chartData = getChartData();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Campaign Analytics Dashboard</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Track performance metrics and ROI across all campaigns
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold">{totals.leads.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Leads Generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold">{totals.conversions.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Conversions</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-2xl font-bold">{totals.revenue.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Revenue Generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-2xl font-bold">{getConversionRate()}%</p>
            <p className="text-sm text-muted-foreground">Conversion Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Daily Leads Generated (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="leads" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Campaign Costs (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cost" fill="#7c3aed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {getTopPerformingCampaigns().length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No performance data available yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Monthly Spend</TableHead>
                  <TableHead>ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getTopPerformingCampaigns().map((participation) => {
                  const campaign = participation.lead_gen_campaigns;
                  const isColdCalling = campaign.name.includes('Cold Calling');
                  const roi = participation.revenue_generated > 0 ? 
                    (((participation.revenue_generated - participation.budget_contribution) / participation.budget_contribution) * 100).toFixed(1) : 
                    '0.0';
                  
                  return (
                    <TableRow key={participation.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isColdCalling ? (
                            <Phone className="h-4 w-4 text-green-600" />
                          ) : (
                            <Target className="h-4 w-4 text-blue-600" />
                          )}
                          <div>
                            <div className="font-medium">{campaign.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {participation.consultant_name}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {isColdCalling ? 'Cold Calling' : 'Facebook Ads'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {participation.leads_received || 0}
                      </TableCell>
                      <TableCell className="font-medium">
                        {participation.conversions || 0}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${(participation.revenue_generated || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {participation.budget_contribution.toLocaleString()} pts
                      </TableCell>
                      <TableCell>
                        <Badge variant={parseFloat(roi) > 0 ? 'default' : 'destructive'}>
                          {roi}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};