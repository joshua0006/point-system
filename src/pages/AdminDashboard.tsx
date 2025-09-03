import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { UserManagement } from "@/components/admin/UserManagement";
import PendingApprovals from "@/components/admin/PendingApprovals";
import { AdminServiceManagement } from "@/components/admin/AdminServiceManagement";
import { AdminInterface } from "@/components/campaigns/AdminInterface";
import { useCampaignTargets } from "@/hooks/useCampaignTargets";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Activity,
  UserCheck,
  Settings,
  Briefcase,
  AlertCircle,
  Target
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { stats, recentActivity, loading, error } = useAdminDashboard();
  
  // Shared campaign targets state
  const { campaignTargets, setCampaignTargets, refreshTargets } = useCampaignTargets();
  const [editingTarget, setEditingTarget] = useState<any>(null);
  const [showTargetDialog, setShowTargetDialog] = useState(false);


  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor platform performance and manage users
          </p>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full max-w-4xl grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Service Management
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Lead Gen Campaigns Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {error && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <p>{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Platform Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-medium">
                    Total Users
                    <Users className="w-4 h-4 text-primary" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-20 mb-2" />
                   ) : (
                     <div className="text-2xl font-bold text-foreground">{(stats?.totalUsers || 0).toLocaleString()}</div>
                   )}
                  <p className="text-xs text-muted-foreground">approved users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-medium">
                    Active Consultants
                    <UserCheck className="w-4 h-4 text-success" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-16 mb-2" />
                   ) : (
                     <div className="text-2xl font-bold text-foreground">{stats?.activeConsultants || 0}</div>
                   )}
                  {loading ? (
                    <Skeleton className="h-4 w-24" />
                   ) : (
                     <p className="text-xs text-muted-foreground">{stats?.activeServices || 0} services listed</p>
                   )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-accent to-accent/80 text-accent-foreground">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-medium">
                    Monthly Volume
                    <DollarSign className="w-4 h-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-24 mb-2 bg-accent-foreground/20" />
                   ) : (
                     <div className="text-2xl font-bold">{(stats?.monthlyVolume || 0).toLocaleString()}</div>
                   )}
                  <p className="text-xs opacity-90">points transacted</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-medium">
                    Active Bookings
                    <Calendar className="w-4 h-4 text-primary" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-16 mb-2" />
                   ) : (
                     <div className="text-2xl font-bold text-foreground">{stats?.activeBookings || 0}</div>
                   )}
                  <p className="text-xs text-muted-foreground">pending & confirmed</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-start space-x-3">
                        <Skeleton className="w-2 h-2 rounded-full mt-2" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          activity.type === 'booking' ? 'bg-primary' :
                          activity.type === 'service' ? 'bg-success' :
                          activity.type === 'completion' ? 'bg-accent' : 
                          activity.type === 'campaign_joined' ? 'bg-blue-500' :
                          activity.type === 'wallet_topup' ? 'bg-green-500' :
                          activity.type === 'campaign_purchase' ? 'bg-orange-500' :
                          activity.type === 'campaign' ? 'bg-warning' : 'bg-muted-foreground'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{activity.description}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                            {activity.points > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {activity.points} pts
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No recent activity to display
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <div className="space-y-6">
              <PendingApprovals />
              <UserManagement />
            </div>
          </TabsContent>

          <TabsContent value="services">
            <AdminServiceManagement />
          </TabsContent>

          <TabsContent value="campaigns">
            <AdminInterface 
              campaignTargets={campaignTargets}
              setCampaignTargets={setCampaignTargets}
              editingTarget={editingTarget}
              setEditingTarget={setEditingTarget}
              showTargetDialog={showTargetDialog}
              setShowTargetDialog={setShowTargetDialog}
              refreshTargets={refreshTargets}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}