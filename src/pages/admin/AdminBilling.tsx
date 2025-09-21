import { AdminPageContainer } from "@/components/admin/common/AdminPageContainer";
import { BillingOverview } from "@/components/admin/BillingOverview";
import { GlobalTransactionLedger } from "@/components/admin/GlobalTransactionLedger";

export default function AdminBilling() {
  return (
    <AdminPageContainer 
      title="Billing & Transactions" 
      description="Monitor billing and transaction activity"
    >
      <div className="space-y-6">
        <BillingOverview />
        <GlobalTransactionLedger />
      </div>
    </AdminPageContainer>
  );
}