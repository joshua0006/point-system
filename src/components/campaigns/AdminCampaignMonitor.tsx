import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Users, DollarSign, TrendingUp, Phone, Target, ToggleLeft, ToggleRight, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserGroup {
  userId: string;
  user: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
  campaigns: any[];
  totalBudget: number;
  activeCampaigns: number;
}

export const AdminCampaignMonitor = () => {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [viewMode, setViewMode] = useState('campaigns'); // 'campaigns' or 'users'

  useEffect(() => {
    fetchAllCampaigns();
  }, []);

  const fetchAllCampaigns = async () => {
    try {
      setLoading(true);
      
      // First get campaign participants with campaign details
      const { data: participantsData, error: participantsError } = await supabase
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
            total_budget,
            created_by
          )
        `)
        .order('joined_at', { ascending: false });

      if (participantsError) throw participantsError;

      // Then get the user profiles for each participant
      const userIds = participantsData?.map(p => p.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const enrichedData = participantsData?.map(participant => ({
        ...participant,
        profiles: profilesData?.find(profile => profile.user_id === participant.user_id) || {}
      })) || [];

      setCampaigns(enrichedData);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to fetch campaign data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openCampaignDetails = (campaign) => {
    setSelectedCampaign(campaign);
    setShowDetailsModal(true);
  };

  const getFilteredCampaigns = () => {
    if (showActiveOnly) {
      return campaigns.filter(c => c.billing_status === 'active');
    }
    return campaigns;
  };

  const getTotalActiveCampaigns = () => {
    return campaigns.filter(c => c.billing_status === 'active').length;
  };

  const getTotalMonthlyRevenue = () => {
    return campaigns
      .filter(c => c.billing_status === 'active')
      .reduce((sum, c) => sum + c.budget_contribution, 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'default';
      case 'stopped': return 'destructive';
      case 'paused_insufficient_funds': return 'secondary';
      default: return 'outline';
    }
  };

  const groupCampaignsByUser = (): UserGroup[] => {
    const userGroups: { [key: string]: UserGroup } = {};
    
    getFilteredCampaigns().forEach(participation => {
      const userId = participation.user_id;
      const profile = participation.profiles;
      
      if (!userGroups[userId]) {
        userGroups[userId] = {
          user: profile || {},
          campaigns: [],
          totalBudget: 0,
          activeCampaigns: 0,
          userId: userId
        };
      }
      
      userGroups[userId].campaigns.push(participation);
      userGroups[userId].totalBudget += participation.budget_contribution;
      
      if (participation.billing_status === 'active') {
        userGroups[userId].activeCampaigns += 1;
      }
    });
    
    return Object.values(userGroups).sort((a, b) => b.totalBudget - a.totalBudget);
  };

  const getUserInitials = (name?: string): string => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Campaign Monitoring</h2>
          <p className="text-lg text-muted-foreground">Loading campaign data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Campaign Monitoring Dashboard</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Monitor all user campaigns and platform performance
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold">{campaigns.length}</p>
            <p className="text-sm text-muted-foreground">Total Campaign Participations</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold">{getTotalActiveCampaigns()}</p>
            <p className="text-sm text-muted-foreground">Active Campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-2xl font-bold">{getTotalMonthlyRevenue().toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Monthly Revenue (Points)</p>
          </CardContent>
        </Card>
      </div>

      {/* View Controls */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-4">
            <CardTitle>Campaign Monitor</CardTitle>
            <Tabs value={viewMode} onValueChange={setViewMode} className="w-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="campaigns" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  By Campaign
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  By User
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {showActiveOnly ? 'Active' : 'All'} Campaigns
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActiveOnly(!showActiveOnly)}
              className="flex items-center gap-2"
            >
              {showActiveOnly ? (
                <ToggleRight className="h-4 w-4 text-green-600" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm">
                {showActiveOnly ? 'Show All' : 'Active Only'}
              </span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No campaigns found
            </div>
          ) : (
            <Tabs value={viewMode} onValueChange={setViewMode}>
              <TabsContent value="campaigns" className="mt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Monthly Budget</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredCampaigns().map((participation) => {
                      const campaign = participation.lead_gen_campaigns;
                      const profile = participation.profiles;
                      const isColdCalling = campaign.name.includes('Cold Calling');
                      
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
                                  {campaign.description?.substring(0, 50)}...
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{profile?.full_name || 'Unknown'}</div>
                              <div className="text-sm text-muted-foreground">{profile?.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {isColdCalling ? 'Cold Calling' : 'Facebook Ads'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {participation.budget_contribution.toLocaleString()} points
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(participation.billing_status)}>
                              {participation.billing_status?.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(participation.joined_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openCampaignDetails(participation)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="users" className="mt-0">
                <div className="space-y-6">
                  {groupCampaignsByUser().map((userGroup) => (
                    <Card key={userGroup.userId} className="border-l-4 border-l-primary/20">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={userGroup.user?.avatar_url} />
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {getUserInitials(userGroup.user?.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-lg">
                                {userGroup.user?.full_name || 'Unknown User'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {userGroup.user?.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-right">
                            <div>
                              <div className="text-2xl font-bold text-primary">
                                {userGroup.totalBudget.toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground">Total Budget (Points)</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-success">
                                {userGroup.activeCampaigns}
                              </div>
                              <div className="text-xs text-muted-foreground">Active Campaigns</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-muted-foreground">
                                {userGroup.campaigns.length}
                              </div>
                              <div className="text-xs text-muted-foreground">Total Campaigns</div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {userGroup.campaigns.map((participation) => {
                            const campaign = participation.lead_gen_campaigns;
                            const isColdCalling = campaign.name.includes('Cold Calling');
                            
                            return (
                              <div 
                                key={participation.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  {isColdCalling ? (
                                    <Phone className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Target className="h-4 w-4 text-blue-600" />
                                  )}
                                  <div>
                                    <div className="font-medium">{campaign.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      Joined: {new Date(participation.joined_at).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <Badge variant="outline" className="text-xs">
                                    {isColdCalling ? 'Cold Calling' : 'Facebook Ads'}
                                  </Badge>
                                  <div className="text-right">
                                    <div className="font-semibold">
                                      {participation.budget_contribution.toLocaleString()} pts
                                    </div>
                                    <Badge 
                                      variant={getStatusColor(participation.billing_status)}
                                      className="text-xs"
                                    >
                                      {participation.billing_status?.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openCampaignDetails(participation)}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Details
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Campaign Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Campaign Details</DialogTitle>
          </DialogHeader>
          
          {selectedCampaign && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Campaign Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name: </span>
                      <span>{selectedCampaign.lead_gen_campaigns.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status: </span>
                      <Badge variant={getStatusColor(selectedCampaign.billing_status)}>
                        {selectedCampaign.billing_status?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Start Date: </span>
                      <span>{new Date(selectedCampaign.lead_gen_campaigns.start_date).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">End Date: </span>
                      <span>{new Date(selectedCampaign.lead_gen_campaigns.end_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Participant Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Consultant: </span>
                      <span>{selectedCampaign.consultant_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email: </span>
                      <span>{selectedCampaign.profiles?.email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Joined: </span>
                      <span>{new Date(selectedCampaign.joined_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Monthly Budget: </span>
                      <span>{selectedCampaign.budget_contribution.toLocaleString()} points</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Performance Metrics</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{selectedCampaign.leads_received || 0}</div>
                    <div className="text-xs text-muted-foreground">Leads Received</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{selectedCampaign.conversions || 0}</div>
                    <div className="text-xs text-muted-foreground">Conversions</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{selectedCampaign.revenue_generated?.toLocaleString() || 0}</div>
                    <div className="text-xs text-muted-foreground">Revenue Generated</div>
                  </div>
                </div>
              </div>

              {selectedCampaign.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {selectedCampaign.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};