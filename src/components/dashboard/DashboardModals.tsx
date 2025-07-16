import { BalanceDetailsModal } from "./BalanceDetailsModal";
import { SpentDetailsModal } from "./SpentDetailsModal";
import { ServicesBookedModal } from "./ServicesBookedModal";
import { CompletionRateModal } from "./CompletionRateModal";
import { UpcomingSessionsModal } from "./UpcomingSessionsModal";
import { RecentTransactionsModal } from "./RecentTransactionsModal";
import { RecentBookingsModal } from "./RecentBookingsModal";
import { TopUpModal } from "@/components/TopUpModal";
import { Transaction, BookedService, UpcomingSession, UserStats } from "@/hooks/useDashboardData";

interface DashboardModalsProps {
  // Modal states
  balanceModalOpen: boolean;
  setBalanceModalOpen: (open: boolean) => void;
  spentModalOpen: boolean;
  setSpentModalOpen: (open: boolean) => void;
  servicesModalOpen: boolean;
  setServicesModalOpen: (open: boolean) => void;
  completionModalOpen: boolean;
  setCompletionModalOpen: (open: boolean) => void;
  upcomingModalOpen: boolean;
  setUpcomingModalOpen: (open: boolean) => void;
  recentTransactionsModalOpen: boolean;
  setRecentTransactionsModalOpen: (open: boolean) => void;
  recentBookingsModalOpen: boolean;
  setRecentBookingsModalOpen: (open: boolean) => void;
  topUpModalOpen: boolean;
  setTopUpModalOpen: (open: boolean) => void;
  
  // Data
  allTransactions: Transaction[];
  spentTransactions: any[];
  bookedServices: BookedService[];
  upcomingBookings: UpcomingSession[];
  userStats: UserStats;
  
  // Callbacks
  onTopUpSuccess?: (amount?: number, showSuccessModal?: boolean) => void;
}

export function DashboardModals({
  balanceModalOpen,
  setBalanceModalOpen,
  spentModalOpen,
  setSpentModalOpen,
  servicesModalOpen,
  setServicesModalOpen,
  completionModalOpen,
  setCompletionModalOpen,
  upcomingModalOpen,
  setUpcomingModalOpen,
  recentTransactionsModalOpen,
  setRecentTransactionsModalOpen,
  recentBookingsModalOpen,
  setRecentBookingsModalOpen,
  topUpModalOpen,
  setTopUpModalOpen,
  allTransactions,
  spentTransactions,
  bookedServices,
  upcomingBookings,
  userStats,
  onTopUpSuccess,
}: DashboardModalsProps) {
  return (
    <>
      <BalanceDetailsModal 
        open={balanceModalOpen}
        onOpenChange={setBalanceModalOpen}
        transactions={allTransactions}
        onTopUp={() => {
          setBalanceModalOpen(false);
          setTopUpModalOpen(true);
        }}
      />
      
      <SpentDetailsModal
        open={spentModalOpen}
        onOpenChange={setSpentModalOpen}
        spentTransactions={spentTransactions}
      />
      
      <ServicesBookedModal
        open={servicesModalOpen}
        onOpenChange={setServicesModalOpen}
        bookedServices={bookedServices}
      />
      
      <CompletionRateModal
        open={completionModalOpen}
        onOpenChange={setCompletionModalOpen}
        services={bookedServices}
        overallRate={Math.round((userStats.completedSessions / userStats.servicesBooked) * 100)}
      />
      
      <UpcomingSessionsModal
        open={upcomingModalOpen}
        onOpenChange={setUpcomingModalOpen}
        sessions={upcomingBookings}
      />
      
      <RecentTransactionsModal
        open={recentTransactionsModalOpen}
        onOpenChange={setRecentTransactionsModalOpen}
        transactions={allTransactions}
      />
      
      <RecentBookingsModal
        open={recentBookingsModalOpen}
        onOpenChange={setRecentBookingsModalOpen}
        bookings={bookedServices}
      />

      <TopUpModal 
        isOpen={topUpModalOpen}
        onClose={() => setTopUpModalOpen(false)}
        onSuccess={onTopUpSuccess}
      />
    </>
  );
}