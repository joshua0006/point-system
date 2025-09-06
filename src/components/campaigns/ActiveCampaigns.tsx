import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pause, Play, Settings, BarChart3, Calendar, DollarSign, Target, Phone, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ActiveCampaignsProps {
  hideInactiveCampaigns: boolean;
  setHideInactiveCampaigns: (hide: boolean) => void;
}

export const ActiveCampaigns = ({ hideInactiveCampaigns, setHideInactiveCampaigns }: ActiveCampaignsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, [user, hideInactiveCampaigns]);

  const fetchCampaigns = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('campaign_participants')
        .select(`
          *,
          lead_gen_campaigns (*)
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaigns:', error);
        return;
      }

      let filteredData = data || [];
      if (hideInactiveCampaigns) {
        filteredData = filteredData.filter(campaign => 
          campaign.billing_status === 'active' || 
          campaign.billing_status === 'paused'
        );
      }

      setCampaigns(filteredData);
    } catch (error) {
      console.error('Error in fetchCampaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCampaignTypeIcon = (campaignName: string) => {
    if (campaignName.toLowerCase().includes('facebook')) return Target;
    if (campaignName.toLowerCase().includes('cold calling')) return Phone;
    if (campaignName.toLowerCase().includes('va support')) return Users;
    return Target;
  };

  const getCampaignTypeColor = (campaignName: string) => {
    if (campaignName.toLowerCase().includes('facebook')) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (campaignName.toLowerCase().includes('cold calling')) return 'text-green-600 bg-green-50 border-green-200';
    if (campaignName.toLowerCase().includes('va support')) return 'text-purple-600 bg-purple-50 border-purple-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'paused_insufficient_funds': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const pauseCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('campaign_participants')
        .update({ billing_status: 'paused' })
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: "Campaign Paused",
        description: "Your campaign has been paused. You can resume it anytime.",
      });

      fetchCampaigns();
    } catch (error) {
      console.error('Error pausing campaign:', error);
      toast({
        title: "Error",
        description: "Failed to pause campaign. Please try again.",
        variant: "destructive"
      });
    }
  };

  const resumeCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('campaign_participants')
        .update({ billing_status: 'active' })
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: "Campaign Resumed",
        description: "Your campaign is now active and running.",
      });

      fetchCampaigns();
    } catch (error) {
      console.error('Error resuming campaign:', error);
      toast({
        title: "Error", 
        description: "Failed to resume campaign. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card className="text-center p-12">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Campaigns Yet</h3>
        <p className="text-muted-foreground mb-4">
          {hideInactiveCampaigns 
            ? "No active campaigns found. Try showing all campaigns or launch a new one."
            : "You haven't launched any campaigns yet. Start generating leads today!"
          }
        </p>
        <Button onClick={() => window.location.href = '/campaigns'}>
          Launch Your First Campaign
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">My Active Campaigns</h2>
          <p className="text-sm text-muted-foreground">
            Manage and monitor your lead generation campaigns
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setHideInactiveCampaigns(!hideInactiveCampaigns)}
        >
          {hideInactiveCampaigns ? 'Show All' : 'Active Only'}
        </Button>
      </div>

      <div className="grid gap-4">
        {campaigns.map((campaign) => {
          const Icon = getCampaignTypeIcon(campaign.lead_gen_campaigns?.name || '');
          const typeColor = getCampaignTypeColor(campaign.lead_gen_campaigns?.name || '');
          const statusColor = getStatusColor(campaign.billing_status);
          const isActive = campaign.billing_status === 'active';
          const isPaused = campaign.billing_status === 'paused' || campaign.billing_status === 'paused_insufficient_funds';

          return (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${typeColor}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {campaign.lead_gen_campaigns?.name || 'Campaign'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Consultant: {campaign.consultant_name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusColor}>
                      {campaign.billing_status === 'paused_insufficient_funds' 
                        ? 'Paused (Low Balance)' 
                        : campaign.billing_status.charAt(0).toUpperCase() + campaign.billing_status.slice(1)
                      }
                    </Badge>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isActive && (
                          <DropdownMenuItem onClick={() => pauseCampaign(campaign.id)}>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause Campaign
                          </DropdownMenuItem>
                        )}
                        {isPaused && (
                          <DropdownMenuItem onClick={() => resumeCampaign(campaign.id)}>
                            <Play className="h-4 w-4 mr-2" />
                            Resume Campaign
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Campaign Settings
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Monthly Budget</p>
                    <p className="font-medium flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {campaign.budget_contribution} pts
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Leads Generated</p>
                    <p className="font-medium">{campaign.leads_received || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Conversions</p>
                    <p className="font-medium">{campaign.conversions || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Next Billing</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {campaign.next_billing_date ? new Date(campaign.next_billing_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {campaign.billing_status === 'paused_insufficient_funds' && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      Campaign paused due to insufficient balance. Please top up your account to resume.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};