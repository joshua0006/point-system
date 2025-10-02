import React from "react";
import { AdminPageContainer } from "@/components/admin/common/AdminPageContainer";
import { AdminReimbursements } from "@/components/admin/AdminReimbursements";

const AdminReimbursementsPage: React.FC = () => {
  return (
    <AdminPageContainer 
      title="Reimbursement Requests" 
      description="Manage user reimbursement requests"
    >
      <AdminReimbursements />
    </AdminPageContainer>
  );
};

export default AdminReimbursementsPage;
