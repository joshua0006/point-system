import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { Settings as SettingsIcon, User, Bell, Shield, CreditCard, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";

import { TransactionHistoryModal } from "@/components/settings/TransactionHistoryModal";
import { AutoReplySettings } from "@/components/settings/AutoReplySettings";
import { useQuery } from "@tanstack/react-query";

const Settings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();
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

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  // Tab configuration
  const tabOptions = [
    { value: "profile", label: "Profile", icon: User },
    { value: "notifications", label: "Notifications", icon: Bell },
    { value: "security", label: "Security", icon: Shield },
    { value: "billing", label: "Billing", icon: CreditCard },
  ];

  // Add auto-reply tab if user is a consultant
  if (isConsultant) {
    tabOptions.push({ value: "auto-reply", label: "Auto-Reply", icon: MessageSquare });
  }

  // Get the active tab from URL or default to profile
  const activeTab = tab || "profile";
  const validTabs = ["profile", "notifications", "security", "billing", "auto-reply"];
  const currentTab = validTabs.includes(activeTab) ? activeTab : "profile";

  // Handle tab changes by navigating to the new URL
  const handleTabChange = (newTab: string) => {
    navigate(`/settings/${newTab}`);
  };

  return (
    <SidebarLayout title="Settings" description="Manage your account settings and preferences">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl">
        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4 sm:space-y-6">
          {/* Unified Navigation - Icon-only on mobile, Icon+Text on desktop */}
          <TabsList className={`grid w-full ${isConsultant ? 'grid-cols-5' : 'grid-cols-4'} gap-1 p-1 h-12 sm:h-10`}>
            {tabOptions.map((option) => {
              const Icon = option.icon;
              return (
                <TabsTrigger
                  key={option.value}
                  value={option.value}
                  className="flex items-center justify-center gap-0 sm:gap-2 px-2 sm:px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                >
                  <Icon className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline text-sm">{option.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="profile">
            <Card className="shadow-sm">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-lg sm:text-xl">Profile Information</CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Update your personal information and how others see you on the platform.
                </p>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted h-11"
                  />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Email cannot be changed. Contact support if you need to update this.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell others about yourself..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="w-full sm:w-auto h-11 min-w-[120px]"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="shadow-sm">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-lg sm:text-xl">Notification Preferences</CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Choose what notifications you want to receive.
                </p>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between gap-4 py-2 sm:py-0">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="text-sm font-medium">Email Notifications</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      Receive notifications via email
                    </div>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                    className="shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 py-2 sm:py-0">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="text-sm font-medium">Campaign Updates</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      Get notified about your campaign performance
                    </div>
                  </div>
                  <Switch
                    checked={campaignUpdates}
                    onCheckedChange={setCampaignUpdates}
                    className="shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 py-2 sm:py-0">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="text-sm font-medium">Marketing Emails</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      Receive updates about new features and promotions
                    </div>
                  </div>
                  <Switch
                    checked={marketingEmails}
                    onCheckedChange={setMarketingEmails}
                    className="shrink-0"
                  />
                </div>

                <Button
                  onClick={handleSaveNotifications}
                  className="w-full sm:w-auto h-11 min-w-[120px]"
                >
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="shadow-sm">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-lg sm:text-xl">Security Settings</CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Manage your account security and authentication.
                </p>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Password</h4>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                      Change your password to keep your account secure.
                    </p>
                    <Button variant="outline" className="w-full sm:w-auto h-11">
                      Change Password
                    </Button>
                  </div>

                  <div className="text-center py-4 px-4 sm:px-0">
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      Additional security features like 2FA and session management will be available soon.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card className="shadow-sm">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-lg sm:text-xl">Billing & Account</CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  View your account balance and transaction history.
                </p>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="space-y-4">
                  <div className="p-4 sm:p-6 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                      <h4 className="text-sm font-medium">Current Points Balance</h4>
                      <div className="text-3xl sm:text-2xl font-bold text-primary">
                        {profile?.flexi_credits_balance?.toLocaleString() || 0}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Points available for campaign participation
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Transaction History</h4>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                      View your past purchases and point usage.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setTransactionHistoryOpen(true)}
                      className="w-full sm:w-auto h-11"
                    >
                      View Full History
                    </Button>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Download Receipts</h4>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                      Download receipts for your purchases and tax records.
                    </p>
                    <Button variant="outline" className="w-full sm:w-auto h-11">
                      Download Receipts
                    </Button>
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
    </SidebarLayout>
  );
};

export default Settings;