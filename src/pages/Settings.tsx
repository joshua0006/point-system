import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Navigation } from "@/components/Navigation";
import { Settings as SettingsIcon, User, Bell, Shield, CreditCard, Wallet, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PaymentMethodsTab } from "@/components/settings/PaymentMethodsTab";
import { TransactionHistoryModal } from "@/components/settings/TransactionHistoryModal";
import { AutoReplySettings } from "@/components/settings/AutoReplySettings";
import { useQuery } from "@tanstack/react-query";

const Settings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile settings state
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  
  // Notification settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [campaignUpdates, setCampaignUpdates] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  
  // Modal states
  const [transactionHistoryOpen, setTransactionHistoryOpen] = useState(false);

  // Check if user is a consultant
  const { data: isConsultant } = useQuery({
    queryKey: ['is-consultant', user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase
        .from('consultants')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking consultant status:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!user,
  });

  // Load profile data when it's available
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user) {
      console.log("Save profile: No user");
      return;
    }
    
    console.log("Save profile: Starting save", { fullName, bio, userId: user.id });
    
    if (!fullName.trim()) {
      toast({
        title: "Validation Error",
        description: "Full name is required.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          bio: bio,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error("Save profile error:", error);
        throw error;
      }

      console.log("Save profile: Success", data);

      // Refresh the profile data in context
      await refreshProfile();

      toast({
        title: "Profile Updated",
        description: "Your profile settings have been saved successfully.",
      });
    } catch (error: any) {
      console.error("Save profile: Failed", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      toast({
        title: "Notification Settings Updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className={`grid w-full ${isConsultant ? 'grid-cols-6' : 'grid-cols-5'}`}>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="payment-methods" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Payment Methods
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
            {isConsultant && (
              <TabsTrigger value="auto-reply" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Auto-Reply
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Update your personal information and how others see you on the platform.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if you need to update this.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell others about yourself..."
                    rows={4}
                  />
                </div>

                <Button onClick={handleSaveProfile} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Choose what notifications you want to receive.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Email Notifications</div>
                    <div className="text-xs text-muted-foreground">
                      Receive notifications via email
                    </div>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Campaign Updates</div>
                    <div className="text-xs text-muted-foreground">
                      Get notified about your campaign performance
                    </div>
                  </div>
                  <Switch
                    checked={campaignUpdates}
                    onCheckedChange={setCampaignUpdates}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Marketing Emails</div>
                    <div className="text-xs text-muted-foreground">
                      Receive updates about new features and promotions
                    </div>
                  </div>
                  <Switch
                    checked={marketingEmails}
                    onCheckedChange={setMarketingEmails}
                  />
                </div>

                <Button onClick={handleSaveNotifications}>Save Notification Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage your account security and authentication.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Password</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Change your password to keep your account secure.
                    </p>
                    <Button variant="outline">Change Password</Button>
                  </div>

                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      Additional security features like 2FA and session management will be available soon.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment-methods">
            <PaymentMethodsTab />
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Account</CardTitle>
                <p className="text-sm text-muted-foreground">
                  View your account balance and transaction history.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">Current Points Balance</h4>
                      <div className="text-2xl font-bold text-primary">
                        {profile?.points_balance?.toLocaleString() || 0}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Points available for campaign participation
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Transaction History</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      View your past purchases and point usage.
                    </p>
                    <Button variant="outline" onClick={() => setTransactionHistoryOpen(true)}>
                      View Full History
                    </Button>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Download Receipts</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Download receipts for your purchases and tax records.
                    </p>
                    <Button variant="outline">Download Receipts</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isConsultant && (
            <TabsContent value="auto-reply">
              <AutoReplySettings />
            </TabsContent>
          )}
        </Tabs>
        
        <TransactionHistoryModal
          isOpen={transactionHistoryOpen}
          onClose={() => setTransactionHistoryOpen(false)}
        />
      </div>
    </div>
  );
};

export default Settings;