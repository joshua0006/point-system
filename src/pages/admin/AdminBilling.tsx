import { lazy, Suspense } from "react";
import { AdminPageContainer } from "@/components/admin/common/AdminPageContainer";
import { CardSkeleton } from "@/components/ui/optimized-skeleton";

// Lazy load heavy components for faster initial page load
const BillingOverview = lazy(() => import("@/components/admin/BillingOverview").then(module => ({ default: module.BillingOverview })));
const GlobalTransactionLedger = lazy(() => import("@/components/admin/GlobalTransactionLedger").then(module => ({ default: module.GlobalTransactionLedger })));

export default function AdminBilling() {
  return (
    <AdminPageContainer 
      title="Billing & Transactions" 
      description="Monitor billing and transaction activity"
    >
      <div className="space-y-6">
        <Suspense fallback={<CardSkeleton />}>
          <BillingOverview />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <GlobalTransactionLedger />
        </Suspense>
      </div>
    </AdminPageContainer>
  );
}