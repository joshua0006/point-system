import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { BillingOverview } from "@/components/admin/BillingOverview";
import { GlobalTransactionLedger } from "@/components/admin/GlobalTransactionLedger";
import { AdminNavigation } from "@/components/admin/AdminNavigation";

export default function AdminBilling() {
  return (
    <SidebarLayout title="Billing & Transactions" description="Monitor billing and transaction activity">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <AdminNavigation />
        <div className="space-y-6">
          <BillingOverview />
          <GlobalTransactionLedger />
        </div>
      </div>
    </SidebarLayout>
  );
}