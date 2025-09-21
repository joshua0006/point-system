import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { UserManagement } from "@/components/admin/UserManagement";
import PendingApprovals from "@/components/admin/PendingApprovals";
import { AdminNavigation } from "@/components/admin/AdminNavigation";

export default function AdminUsers() {
  return (
    <SidebarLayout title="User Management" description="Manage platform users and approvals">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <AdminNavigation />
        <div className="space-y-6">
          <PendingApprovals />
          <UserManagement />
        </div>
      </div>
    </SidebarLayout>
  );
}