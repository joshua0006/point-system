import { useState } from "react";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { AdminTabNavigation } from "@/components/admin/AdminTabNavigation";
import { useCampaignTargets } from "@/hooks/useCampaignTargets";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import type { CampaignTarget } from "@/config/types";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { stats, recentActivity, allActivity, activeFilter, filterActivities, loading, error, refreshData } = useAdminDashboard();
  
  // Shared campaign targets state
  const { campaignTargets, setCampaignTargets, refreshTargets } = useCampaignTargets();
  const [editingTarget, setEditingTarget] = useState<CampaignTarget | null>(null);
  const [showTargetDialog, setShowTargetDialog] = useState(false);

  return (
    <SidebarLayout title="Admin Dashboard" description="Monitor platform performance and manage users">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <AdminTabNavigation
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
          stats={stats}
          recentActivity={recentActivity}
          allActivity={allActivity}
          activeFilter={activeFilter}
          loading={loading}
          error={error}
          onFilterActivities={filterActivities}
          onRefreshData={refreshData}
          campaignTargets={campaignTargets}
          setCampaignTargets={setCampaignTargets}
          editingTarget={editingTarget}
          setEditingTarget={setEditingTarget}
          showTargetDialog={showTargetDialog}
          setShowTargetDialog={setShowTargetDialog}
          refreshTargets={refreshTargets}
        />
      </div>
    </SidebarLayout>
  );
}