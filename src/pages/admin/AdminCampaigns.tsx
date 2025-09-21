import { useState } from "react";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { AdminInterface } from "@/components/campaigns/AdminInterface";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { useCampaignTargets } from "@/hooks/useCampaignTargets";
import type { CampaignTarget } from "@/config/types";

export default function AdminCampaigns() {
  // Shared campaign targets state
  const { campaignTargets, setCampaignTargets, refreshTargets } = useCampaignTargets();
  const [editingTarget, setEditingTarget] = useState<CampaignTarget | null>(null);
  const [showTargetDialog, setShowTargetDialog] = useState(false);

  return (
    <SidebarLayout title="Campaign Management" description="Manage lead generation campaigns and settings">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <AdminNavigation />
        <AdminInterface 
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