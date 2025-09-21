import { AdminPageContainer } from "@/components/admin/common/AdminPageContainer";
import { UserManagement } from "@/components/admin/UserManagement";
import PendingApprovals from "@/components/admin/PendingApprovals";

export default function AdminUsers() {
  return (
    <AdminPageContainer 
      title="User Management" 
      description="Manage platform users and approvals"
    >
      <div className="space-y-6">
        <PendingApprovals />
        <UserManagement />
      </div>
    </AdminPageContainer>
  );
}