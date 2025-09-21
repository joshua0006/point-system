import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { AdminServiceManagement } from "@/components/admin/AdminServiceManagement";
import { AdminNavigation } from "@/components/admin/AdminNavigation";

export default function AdminServices() {
  return (
    <SidebarLayout title="Service Management" description="Manage platform services and consultants">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <AdminNavigation />
        <AdminServiceManagement />
      </div>
    </SidebarLayout>
  );
}