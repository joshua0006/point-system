import { AdminPageContainer } from "@/components/admin/common/AdminPageContainer";
import { AdminServiceManagement } from "@/components/admin/AdminServiceManagement";

export default function AdminServices() {
  return (
    <AdminPageContainer 
      title="Service Management" 
      description="Manage platform services and consultants"
    >
      <AdminServiceManagement />
    </AdminPageContainer>
  );
}