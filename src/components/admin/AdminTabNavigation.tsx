import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Settings, 
  DollarSign, 
  Briefcase, 
  Target 
} from "lucide-react";
import { UserManagement } from "@/components/admin/UserManagement";
import PendingApprovals from "@/components/admin/PendingApprovals";
import { AdminServiceManagement } from "@/components/admin/AdminServiceManagement";
import { AdminInterface } from "@/components/campaigns/AdminInterface";
import { BillingOverview } from "@/components/admin/BillingOverview";
import { GlobalTransactionLedger } from "@/components/admin/GlobalTransactionLedger";
import { AdminDashboardStats } from "./AdminDashboardStats";
import { AdminActivityLog } from "./AdminActivityLog";
import { AdminStats, RecentActivity } from "@/hooks/useAdminDashboard";
import type { CampaignTarget } from "@/config/types";

interface AdminTabNavigationProps {
  activeTab: string;
  onActiveTabChange: (tab: string) => void;
  stats?: AdminStats;
  recentActivity: RecentActivity[];
  allActivity?: RecentActivity[];
  activeFilter: string;
  loading: boolean;
  error: string | null;
  onFilterActivities: (filter: string) => void;
  onRefreshData: () => void;
  campaignTargets: CampaignTarget[];
  setCampaignTargets: (targets: CampaignTarget[]) => void;
  editingTarget: CampaignTarget | null;
  setEditingTarget: (target: CampaignTarget | null) => void;
  showTargetDialog: boolean;
  setShowTargetDialog: (show: boolean) => void;
  refreshTargets: () => Promise<void>;
}

export function AdminTabNavigation(props: AdminTabNavigationProps) {
  const {
    activeTab,
    onActiveTabChange,
    stats,
    recentActivity,
    allActivity,
    activeFilter,
    loading,
    error,
    onFilterActivities,
    onRefreshData,
    campaignTargets,
    setCampaignTargets,
    editingTarget,
    setEditingTarget,
    showTargetDialog,
    setShowTargetDialog,
    refreshTargets
  } = props;

  return (
    <Tabs value={activeTab} onValueChange={onActiveTabChange} className="mb-8">
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
        <AdminDashboardStats stats={stats} loading={loading} error={error} />
        <AdminActivityLog 
          recentActivity={recentActivity}
          allActivity={allActivity}
          activeFilter={activeFilter}
          loading={loading}
          onFilterActivities={onFilterActivities}
          onRefreshData={onRefreshData}
        />
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
  );
}