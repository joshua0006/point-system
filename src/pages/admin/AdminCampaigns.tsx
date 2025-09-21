import { useState } from "react";
import { AdminPageContainer } from "@/components/admin/common/AdminPageContainer";
import { AdminInterface } from "@/components/campaigns/AdminInterface";
import { useCampaignTargets } from "@/hooks/useCampaignTargets";
import type { CampaignTarget } from "@/config/types";

export default function AdminCampaigns() {
  // Shared campaign targets state
  const { campaignTargets, setCampaignTargets, refreshTargets } = useCampaignTargets();
  const [editingTarget, setEditingTarget] = useState<CampaignTarget | null>(null);
  const [showTargetDialog, setShowTargetDialog] = useState(false);

  return (
    <AdminPageContainer 
      title="Campaign Management" 
      description="Manage lead generation campaigns and settings"
      onRetry={refreshTargets}
    >
      <AdminInterface 
        campaignTargets={campaignTargets}
        setCampaignTargets={setCampaignTargets}
        editingTarget={editingTarget}
        setEditingTarget={setEditingTarget}
        showTargetDialog={showTargetDialog}
        setShowTargetDialog={setShowTargetDialog}
        refreshTargets={refreshTargets}
      />
    </AdminPageContainer>
  );
}