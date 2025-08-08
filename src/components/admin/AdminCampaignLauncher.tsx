import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Rocket, DollarSign, Users, Calendar, AlertTriangle, CheckCircle2, Pause, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: 'user' | 'consultant' | 'admin';
  points_balance: number;
  created_at: string;
  updated_at: string;
  approval_status: 'pending' | 'approved' | 'rejected';
}

interface CampaignTemplate {
  id: string;
  name: string;
  description: string | null;
  target_audience: string;
  campaign_angle: string;
  is_active: boolean;
  template_config: any;
}

interface AdminCampaignParticipant {
  id: string;
  campaign_id: string;
  user_id: string;
  consultant_name: string;
  budget_contribution: number;
  billing_status: string;
  joined_at: string;
  next_billing_date: string | null;
  leads_received: number;
  conversions: number;
  revenue_generated: number;
  user_email?: string;
  user_name?: string;
  campaign_name?: string;
}

export function AdminCampaignLauncher() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignTemplate[]>([]);
  const [activeParticipants, setActiveParticipants] = useState<AdminCampaignParticipant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [campaignBudget, setCampaignBudget] = useState("");
  const [campaignDuration, setCampaignDuration] = useState("30");
  const [showLaunchDialog, setShowLaunchDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchCampaigns();
    fetchActiveParticipants();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('approval_status', 'approved')
        .neq('role', 'admin')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    }
  };

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_templates')
        .select('id, name, description, target_audience, campaign_angle, is_active, template_config')
        .eq('is_active', true)
        .order('target_audience', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      // Deduplicate by name + angle to avoid near-duplicate templates
      const seen = new Set<string>();
      const unique = (data || []).filter((t) => {
        const key = `${t.name}|${t.campaign_angle}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setCampaigns(unique);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive",
      });
    }
  };

  const fetchActiveParticipants = async () => {
    try {
      // First get participants
      const { data: participants, error: participantsError } = await supabase
        .from('campaign_participants')
        .select('*')
        .eq('billing_status', 'active')
        .order('joined_at', { ascending: false });

      if (participantsError) throw participantsError;

      // Then get user info for each participant
      const participantsWithUserInfo = [];
      for (const participant of participants || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('user_id', participant.user_id)
          .single();

        const { data: campaign } = await supabase
          .from('lead_gen_campaigns')
          .select('name')
          .eq('id', participant.campaign_id)
          .single();

        participantsWithUserInfo.push({
          ...participant,
          user_email: profile?.email,
          user_name: profile?.full_name,
          campaign_name: campaign?.name
        });
      }

      setActiveParticipants(participantsWithUserInfo);
    } catch (error) {
      console.error('Error fetching active participants:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const selectedCampaignData = campaigns.find(c => c.id === selectedCampaign);

  const handleLaunchCampaign = () => {
    if (!selectedUser || !selectedCampaign || !campaignBudget) {
      toast({
        title: "Missing Information",
        description: "Please select a user, campaign, and budget",
        variant: "destructive",
      });
      return;
    }

    const budget = parseInt(campaignBudget);
    if (budget > selectedUser.points_balance) {
      toast({
        title: "Insufficient Balance",
        description: `User only has ${selectedUser.points_balance} points available`,
        variant: "destructive",
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmLaunch = async () => {
    if (!selectedUser || !selectedCampaign) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-campaign-launcher', {
        body: {
          action: 'launch_campaign',
          userId: selectedUser.user_id,
          templateId: selectedCampaign,
          budget: parseInt(campaignBudget),
          duration: parseInt(campaignDuration)
        }
      });

      if (error) throw error;

      toast({
        title: "Campaign Launched",
        description: `Successfully launched campaign for ${selectedUser.full_name || selectedUser.email}`,
      });

      // Reset form
      setSelectedUser(null);
      setSelectedCampaign("");
      setCampaignBudget("");
      setCampaignDuration("30");
      setShowLaunchDialog(false);
      setShowConfirmDialog(false);

      // Refresh data
      fetchUsers();
      fetchActiveParticipants();
    } catch (error: any) {
      console.error('Campaign launch error:', error);
      toast({
        title: "Launch Failed",
        description: error.message || "Failed to launch campaign",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePauseCampaign = async (participantId: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-campaign-launcher', {
        body: {
          action: 'pause_campaign',
          participantId
        }
      });

      if (error) throw error;

      toast({
        title: "Campaign Paused",
        description: "Campaign billing has been paused",
      });

      fetchActiveParticipants();
    } catch (error: any) {
      console.error('Pause campaign error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to pause campaign",
        variant: "destructive",
      });
    }
  };

  const handleResumeCampaign = async (participantId: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-campaign-launcher', {
        body: {
          action: 'resume_campaign',
          participantId
        }
      });

      if (error) throw error;

      toast({
        title: "Campaign Resumed",
        description: "Campaign billing has been resumed",
      });

      fetchActiveParticipants();
    } catch (error: any) {
      console.error('Resume campaign error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to resume campaign",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Campaign Launcher</h2>
          <p className="text-muted-foreground">Launch Facebook ad campaigns for users and manage billing</p>
        </div>
        <Button onClick={() => setShowLaunchDialog(true)} className="flex items-center gap-2">
          <Rocket className="w-4 h-4" />
          Launch Campaign
        </Button>
      </div>

      {/* Active Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Active Campaign Participants
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeParticipants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active campaign participants
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeParticipants.map((participant) => (
                  <TableRow key={participant.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{participant.user_name || "No name"}</div>
                        <div className="text-sm text-muted-foreground">{participant.user_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{participant.campaign_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Joined {new Date(participant.joined_at).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{participant.budget_contribution} pts</div>
                      {participant.next_billing_date && (
                        <div className="text-sm text-muted-foreground">
                          Next: {new Date(participant.next_billing_date).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">Leads: {participant.leads_received}</div>
                        <div className="text-sm">Conv: {participant.conversions}</div>
                        <div className="text-sm">Rev: {participant.revenue_generated} pts</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        participant.billing_status === 'active' ? 'default' :
                        participant.billing_status === 'paused' ? 'secondary' : 'destructive'
                      }>
                        {participant.billing_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {participant.billing_status === 'active' ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePauseCampaign(participant.id)}
                          >
                            <Pause className="w-3 h-3" />
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleResumeCampaign(participant.id)}
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Launch Campaign Dialog */}
      <Dialog open={showLaunchDialog} onOpenChange={setShowLaunchDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Launch Campaign for User</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Selection */}
            <div className="space-y-4">
              <div>
                <Label>Select User</Label>
                <Select
                  value={selectedUser?.id || ""}
                  onValueChange={(value) => {
                    const user = filteredUsers.find(u => u.id === value);
                    setSelectedUser(user || null);
                  }}
                >
                  <SelectTrigger className="w-full bg-background border border-border">
                    <SelectValue placeholder="Choose a user from the system...">
                      {selectedUser && (
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={selectedUser.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {(selectedUser.full_name || selectedUser.email).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{selectedUser.full_name || "No name"} ({selectedUser.email})</span>
                          <Badge variant="secondary" className="text-xs">
                            {selectedUser.points_balance} pts
                          </Badge>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="w-full max-h-60 bg-background border border-border shadow-lg z-50">
                    <div className="p-2">
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name or email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-background"
                        />
                      </div>
                    </div>
                    {filteredUsers.map((user) => (
                      <SelectItem 
                        key={user.id} 
                        value={user.id}
                        className="cursor-pointer hover:bg-muted focus:bg-muted"
                      >
                        <div className="flex items-center space-x-3 w-full">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>
                              {(user.full_name || user.email).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">
                              {user.full_name || "No name"}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {user.email}
                            </div>
                            <div className="text-sm font-medium text-primary">
                              {user.points_balance} points available
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                    {filteredUsers.length === 0 && (
                      <div className="p-4 text-center text-muted-foreground">
                        No users found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Campaign Configuration */}
            <div className="space-y-4">
              <div>
                <Label>Campaign</Label>
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name} · {campaign.target_audience} · {campaign.campaign_angle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCampaignData && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="font-medium">{selectedCampaignData.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {selectedCampaignData.description}
                  </div>
                  <div className="text-sm mt-2 space-y-1">
                    <div>
                      <strong>Audience:</strong> {selectedCampaignData.target_audience}
                    </div>
                    <div>
                      <strong>Angle:</strong> {selectedCampaignData.campaign_angle}
                    </div>
                    {selectedCampaignData.template_config?.budget?.min !== undefined && selectedCampaignData.template_config?.budget?.max !== undefined && (
                      <div>
                        <strong>Suggested Budget:</strong> {selectedCampaignData.template_config.budget.min} - {selectedCampaignData.template_config.budget.max} points
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <Label>Campaign Budget (Points)</Label>
                <Input
                  type="number"
                  placeholder="Enter budget amount"
                  value={campaignBudget}
                  onChange={(e) => setCampaignBudget(e.target.value)}
                  min="1"
                  max={selectedUser?.points_balance || undefined}
                />
                {selectedUser && campaignBudget && parseInt(campaignBudget) > selectedUser.points_balance && (
                  <div className="text-sm text-destructive mt-1">
                    Budget exceeds user's available balance ({selectedUser.points_balance} points)
                  </div>
                )}
              </div>

              <div>
                <Label>Campaign Duration (Days)</Label>
                <Select value={campaignDuration} onValueChange={setCampaignDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLaunchDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleLaunchCampaign}
              disabled={!selectedUser || !selectedCampaign || !campaignBudget}
            >
              Launch Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Confirm Campaign Launch
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <p>You are about to launch a campaign with the following details:</p>
                <div className="bg-muted p-3 rounded-lg space-y-2">
                  <div><strong>User:</strong> {selectedUser?.full_name || selectedUser?.email}</div>
                  <div><strong>Campaign:</strong> {selectedCampaignData?.name}</div>
                  <div><strong>Budget:</strong> {campaignBudget} points</div>
                  <div><strong>Duration:</strong> {campaignDuration} days</div>
                </div>
                <p className="text-warning">
                  This will immediately deduct {campaignBudget} points from the user's balance and start the campaign.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLaunch} disabled={loading}>
              {loading ? "Launching..." : "Confirm Launch"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}