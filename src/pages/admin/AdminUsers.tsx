import React, { lazy, Suspense } from "react";
import { AdminPageContainer } from "@/components/admin/common/AdminPageContainer";
import { CardSkeleton, TableSkeleton } from "@/components/ui/optimized-skeleton";

// PERFORMANCE: Code-split heavy admin components to reduce initial bundle
// AdminUsers was 76 KB - splitting into lazy-loaded chunks reduces to ~10 KB initial
const OptimizedUserManagement = lazy(() => import("@/components/optimized/OptimizedUserManagement").then(m => ({ default: m.OptimizedUserManagement })));
const PendingApprovals = lazy(() => import("@/components/admin/PendingApprovals"));
const RecurringDeductionsTable = lazy(() => import("@/components/admin/RecurringDeductionsTable").then(m => ({ default: m.RecurringDeductionsTable })));

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
        <Suspense fallback={<CardSkeleton />}>
          <PendingApprovals />
        </Suspense>

        <Suspense fallback={<CardSkeleton />}>
          <RecurringDeductionsTable />
        </Suspense>

        <Suspense fallback={<TableSkeleton />}>
          <OptimizedUserManagement onUserAction={handleUserAction} />
        </Suspense>
      </div>
    </AdminPageContainer>
  );
};

export default AdminUsers;