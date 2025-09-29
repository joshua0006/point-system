import React from "react";
import { AdminPageContainer } from "@/components/admin/common/AdminPageContainer";
import { OptimizedUserManagement } from "@/components/optimized/OptimizedUserManagement";
import PendingApprovals from "@/components/admin/PendingApprovals";

const AdminUsers: React.FC = () => {
  const handleUserAction = (user: any, action: string) => {
    // This will be handled by the modals within OptimizedUserManagement
    console.log('User action:', action, user);
  };

  return (
    <AdminPageContainer 
      title="User Management" 
      description="Manage platform users and approvals"
    >
      <div className="space-y-6">
        <PendingApprovals />
        <OptimizedUserManagement onUserAction={handleUserAction} />
      </div>
    </AdminPageContainer>
  );
};

export default AdminUsers;