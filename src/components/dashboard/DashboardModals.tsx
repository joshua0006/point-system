import { BalanceDetailsModal } from "./BalanceDetailsModal";
import { SpentDetailsModal } from "./SpentDetailsModal";
import { ServicesBookedModal } from "./ServicesBookedModal";
import { CompletionRateModal } from "./CompletionRateModal";
import { UpcomingSessionsModal } from "./UpcomingSessionsModal";
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
  
  // Data
  allTransactions: Transaction[];
  spentTransactions: any[];
  bookedServices: BookedService[];
  upcomingBookings: UpcomingSession[];
  userStats: UserStats;
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
  allTransactions,
  spentTransactions,
  bookedServices,
  upcomingBookings,
  userStats,
}: DashboardModalsProps) {
  return (
    <>
      <BalanceDetailsModal 
        open={balanceModalOpen}
        onOpenChange={setBalanceModalOpen}
        transactions={allTransactions}
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
    </>
  );
}