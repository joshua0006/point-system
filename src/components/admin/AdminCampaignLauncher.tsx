import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Rocket, User, Target, DollarSign } from "lucide-react";

interface User {
  user_id: string;
  full_name: string | null;
  email: string;
  flexi_credits_balance: number;
}

interface CampaignTemplate {
  id: string;
  name: string;
  description: string | null;
  target_audience: string;
  campaign_angle: string;
}

export function AdminCampaignLauncher() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [budget, setBudget] = useState<string>("500");
  const [prorationEnabled, setProrationEnabled] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchTemplates();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, flexi_credits_balance')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error loading users",
        description: "Failed to load user list",
        variant: "destructive"
      });
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_templates')
        .select('id, name, description, target_audience, campaign_angle')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error loading templates",
        description: "Failed to load campaign templates",
        variant: "destructive"
      });
    }
  };

  const handleLaunchCampaign = async () => {
    if (!selectedUserId) {
      toast({
        title: "User required",
        description: "Please select a user to launch the campaign for",
        variant: "destructive"
      });
      return;
    }

    if (!selectedTemplateId) {
      toast({
        title: "Template required",
        description: "Please select a campaign template",
        variant: "destructive"
      });
      return;
    }

    const budgetAmount = parseInt(budget);
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      toast({
        title: "Invalid budget",
        description: "Please enter a valid budget amount",
        variant: "destructive"
      });
      return;
    }

    const selectedUser = users.find(u => u.user_id === selectedUserId);
    if (selectedUser && selectedUser.flexi_credits_balance < budgetAmount) {
      toast({
        title: "Insufficient balance",
        description: `User only has ${selectedUser.flexi_credits_balance} Flexi Credits`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-campaign-launcher', {
        body: {
          action: 'launch_campaign',
          userId: selectedUserId,
          templateId: selectedTemplateId,
          budget: budgetAmount,
          prorationEnabled
        }
      });

      if (error) throw error;

      toast({
        title: "Campaign launched!",
        description: data.message || "Campaign has been successfully launched"
      });

      // Reset form
      setSelectedUserId("");
      setSelectedTemplateId("");
      setBudget("500");
      setProrationEnabled(false);
      
      // Refresh users to update balances
      await fetchUsers();
    } catch (error: any) {
      console.error('Error launching campaign:', error);
      toast({
        title: "Launch failed",
        description: error.message || "Failed to launch campaign",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = users.find(u => u.user_id === selectedUserId);
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          Launch Campaign on Behalf of User
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Selection */}
        <div className="space-y-2">
          <Label htmlFor="user-select" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Select User
          </Label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger id="user-select">
              <SelectValue placeholder="Choose a user..." />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.user_id} value={user.user_id}>
                  {user.full_name || user.email} - {user.flexi_credits_balance} credits
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedUser && (
            <p className="text-sm text-muted-foreground">
              Current balance: <span className="font-semibold">{selectedUser.flexi_credits_balance} Flexi Credits</span>
            </p>
          )}
        </div>

        {/* Template Selection */}
        <div className="space-y-2">
          <Label htmlFor="template-select" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Campaign Template
          </Label>
          <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
            <SelectTrigger id="template-select">
              <SelectValue placeholder="Choose a campaign template..." />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name} - {template.target_audience}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTemplate && (
            <p className="text-sm text-muted-foreground">
              {selectedTemplate.description}
            </p>
          )}
        </div>

        {/* Budget Input */}
        <div className="space-y-2">
          <Label htmlFor="budget-input" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Budget (Flexi Credits)
          </Label>
          <Input
            id="budget-input"
            type="number"
            min="1"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Enter budget amount"
          />
        </div>

        {/* Proration Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="proration-toggle">Enable Proration</Label>
            <p className="text-sm text-muted-foreground">
              Adjust first month's charge based on remaining days
            </p>
          </div>
          <Switch
            id="proration-toggle"
            checked={prorationEnabled}
            onCheckedChange={setProrationEnabled}
          />
        </div>

        {/* Launch Button */}
        <Button 
          onClick={handleLaunchCampaign} 
          disabled={loading || !selectedUserId || !selectedTemplateId}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Launching Campaign...
            </>
          ) : (
            <>
              <Rocket className="mr-2 h-4 w-4" />
              Launch Campaign
            </>
          )}
        </Button>

        {/* Summary */}
        {selectedUser && selectedTemplate && budget && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h4 className="font-semibold">Launch Summary</h4>
            <div className="text-sm space-y-1">
              <p><span className="text-muted-foreground">User:</span> {selectedUser.full_name || selectedUser.email}</p>
              <p><span className="text-muted-foreground">Template:</span> {selectedTemplate.name}</p>
              <p><span className="text-muted-foreground">Budget:</span> {budget} Flexi Credits</p>
              <p><span className="text-muted-foreground">Proration:</span> {prorationEnabled ? 'Enabled' : 'Disabled'}</p>
              <p><span className="text-muted-foreground">Remaining balance after launch:</span> {selectedUser.flexi_credits_balance - parseInt(budget)} credits</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
