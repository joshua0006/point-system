import { useState, useEffect } from "react";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { UserManagement } from "@/components/admin/UserManagement";
import PendingApprovals from "@/components/admin/PendingApprovals";
import { AdminServiceManagement } from "@/components/admin/AdminServiceManagement";
import { AdminInterface } from "@/components/campaigns/AdminInterface";
import { BillingOverview } from "@/components/admin/BillingOverview";
import { GlobalTransactionLedger } from "@/components/admin/GlobalTransactionLedger";
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
  const { stats, recentActivity, allActivity, activeFilter, filterActivities, loading, error, refreshData } = useAdminDashboard();
  
  // Shared campaign targets state
  const { campaignTargets, setCampaignTargets, refreshTargets } = useCampaignTargets();
  const [editingTarget, setEditingTarget] = useState<any>(null);
  const [showTargetDialog, setShowTargetDialog] = useState(false);


  return (
    <SidebarLayout title="Admin Dashboard" description="Monitor platform performance and manage users">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full max-w-5xl grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Billing & Transactions
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
                  <p className="text-xs text-muted-foreground">total registered users</p>
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
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Flexi Credits Activity Log</span>
                    <Badge variant="outline" className="text-xs">
                      {allActivity?.length || 0} total
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={refreshData}
                      disabled={loading}
                      className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-primary/90 disabled:opacity-50"
                    >
                      {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {[
                    { key: "all", label: "All", icon: "🔍" },
                    { key: "credit", label: "Credits", icon: "💰" },
                    { key: "debit", label: "Debits", icon: "💸" },
                    { key: "campaign", label: "Campaigns", icon: "🎯" },
                    { key: "subscription", label: "Subscriptions", icon: "📋" },
                    { key: "booking", label: "Bookings", icon: "📅" },
                    { key: "system", label: "System", icon: "🔧" },
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => filterActivities(filter.key)}
                      className={`text-xs px-3 py-1 rounded-full transition-colors ${
                        activeFilter === filter.key
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {filter.icon} {filter.label}
                    </button>
                  ))}
                </div>
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
                       <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                         <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border mt-0.5">
                           <span className="text-sm">{activity.emoji || '📊'}</span>
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="text-sm text-foreground leading-relaxed">{activity.description}</p>
                           <div className="flex items-center justify-between mt-2">
                             <div className="flex items-center gap-2">
                               <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                               <Badge 
                                 variant="secondary" 
                                 className={`text-xs ${
                                   activity.category === 'credit' ? 'bg-green-100 text-green-800' :
                                   activity.category === 'debit' ? 'bg-red-100 text-red-800' :
                                   activity.category === 'campaign' ? 'bg-blue-100 text-blue-800' :
                                   activity.category === 'subscription' ? 'bg-purple-100 text-purple-800' :
                                   activity.category === 'booking' ? 'bg-orange-100 text-orange-800' :
                                   'bg-gray-100 text-gray-800'
                                 }`}
                               >
                                 {activity.category}
                               </Badge>
                             </div>
                             {activity.points > 0 && (
                               <Badge variant="outline" className="text-xs font-mono">
                                 {activity.category === 'credit' ? '+' : activity.category === 'debit' ? '-' : ''}{activity.points} pts
                               </Badge>
                             )}
                           </div>
                         </div>
                       </div>
                     ))}
                  </div>
                 ) : (
                   <div className="text-center py-12">
                     <Activity className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                     <p className="text-sm text-muted-foreground">
                       {activeFilter === "all" 
                         ? "No recent activity to display" 
                         : `No ${activeFilter} activities found`
                       }
                     </p>
                   </div>
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

          <TabsContent value="billing">
            <div className="space-y-6">
              <BillingOverview />
              <GlobalTransactionLedger />
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
    </SidebarLayout>
  );
}