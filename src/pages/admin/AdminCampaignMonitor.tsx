import { AdminPageContainer } from "@/components/admin/common/AdminPageContainer";
import { AdminCampaignMonitor } from "@/components/campaigns/AdminCampaignMonitor";

export default function AdminCampaignMonitorPage() {
  return (
    <AdminPageContainer 
      title="Campaign Monitoring" 
      description="Monitor all user campaigns and platform performance"
    >
      <AdminCampaignMonitor />
    </AdminPageContainer>
  );
}