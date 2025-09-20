import { memo } from "react";
import { BalanceDetailsModal } from "./BalanceDetailsModal";
import { SpentDetailsModal } from "./SpentDetailsModal";
import { RecentTransactionsModal } from "./RecentTransactionsModal";
import { TopUpModal } from "@/components/TopUpModal";
import { UpcomingChargesModal } from "./UpcomingChargesModal";
import { Transaction, UserStats } from "@/hooks/useDashboardData";
import { ModalType } from "@/hooks/useDashboardModals";

interface OptimizedDashboardModalsProps {
  modalState: {
    balance: boolean;
    spent: boolean;
    services: boolean;
    completion: boolean;
    upcoming: boolean;
    recentTransactions: boolean;
    recentBookings: boolean;
    topUp: boolean;
    upcomingCharges: boolean;
  };
  closeModal: (type: ModalType) => void;
  openModal: (type: ModalType) => void;
  allTransactions: Transaction[];
  spentTransactions: any[];
  userStats: UserStats;
  onTopUpSuccess?: (amount?: number, showSuccessModal?: boolean) => void;
}

export const OptimizedDashboardModals = memo(({
  modalState,
  closeModal,
  openModal,
  allTransactions,
  spentTransactions,
  userStats,
  onTopUpSuccess,
}: OptimizedDashboardModalsProps) => {
  const handleTopUpClick = () => {
    closeModal('balance');
    openModal('topUp');
  };

  const handleUpcomingChargesClick = () => {
    closeModal('balance');
    openModal('upcomingCharges');
  };

  return (
    <>
      <BalanceDetailsModal 
        open={modalState.balance}
        onOpenChange={(open) => !open && closeModal('balance')}
        onTopUp={handleTopUpClick}
        onViewUpcomingCharges={handleUpcomingChargesClick}
        userStats={userStats}
      />
      
      <SpentDetailsModal
        open={modalState.spent}
        onOpenChange={(open) => !open && closeModal('spent')}
        spentTransactions={spentTransactions}
      />
      
      <RecentTransactionsModal
        open={modalState.recentTransactions}
        onOpenChange={(open) => !open && closeModal('recentTransactions')}
        transactions={allTransactions}
      />

      <TopUpModal 
        isOpen={modalState.topUp}
        onClose={() => closeModal('topUp')}
        onSuccess={onTopUpSuccess}
      />
      
      <UpcomingChargesModal
        open={modalState.upcomingCharges}
        onOpenChange={(open) => !open && closeModal('upcomingCharges')}
      />
    </>
  );
});