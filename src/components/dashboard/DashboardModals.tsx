import { lazy, Suspense } from "react";
import { Transaction, BookedService, UpcomingSession, UserStats } from "@/hooks/useDashboard";

// Lazy load all modal components for better code splitting
const BalanceDetailsModal = lazy(() => import("./BalanceDetailsModal").then(m => ({ default: m.BalanceDetailsModal })));
const SpentDetailsModal = lazy(() => import("./SpentDetailsModal").then(m => ({ default: m.SpentDetailsModal })));
const ServicesBookedModal = lazy(() => import("./ServicesBookedModal").then(m => ({ default: m.ServicesBookedModal })));
const CompletionRateModal = lazy(() => import("./CompletionRateModal").then(m => ({ default: m.CompletionRateModal })));
const UpcomingSessionsModal = lazy(() => import("./UpcomingSessionsModal").then(m => ({ default: m.UpcomingSessionsModal })));
const RecentTransactionsModal = lazy(() => import("./RecentTransactionsModal").then(m => ({ default: m.RecentTransactionsModal })));
const RecentBookingsModal = lazy(() => import("./RecentBookingsModal").then(m => ({ default: m.RecentBookingsModal })));
const TopUpModal = lazy(() => import("@/components/TopUpModal").then(m => ({ default: m.TopUpModal })));
const UpcomingChargesModal = lazy(() => import("./UpcomingChargesModal").then(m => ({ default: m.UpcomingChargesModal })));

interface DashboardModalsProps {
  // Modal states
  balanceModalOpen: boolean;
  setBalanceModalOpen: (open: boolean) => void;
  spentModalOpen: boolean;
  setSpentModalOpen: (open: boolean) => void;
  servicesModalOpen?: boolean;
  setServicesModalOpen?: (open: boolean) => void;
  completionModalOpen?: boolean;
  setCompletionModalOpen?: (open: boolean) => void;
  upcomingModalOpen?: boolean;
  setUpcomingModalOpen?: (open: boolean) => void;
  recentTransactionsModalOpen: boolean;
  setRecentTransactionsModalOpen: (open: boolean) => void;
  recentBookingsModalOpen?: boolean;
  setRecentBookingsModalOpen?: (open: boolean) => void;
  topUpModalOpen: boolean;
  setTopUpModalOpen: (open: boolean) => void;
  upcomingChargesModalOpen?: boolean;
  setUpcomingChargesModalOpen?: (open: boolean) => void;
  
  // Data
  allTransactions: Transaction[];
  spentTransactions: any[];
  bookedServices?: BookedService[];
  upcomingBookings?: UpcomingSession[];
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
  upcomingChargesModalOpen,
  setUpcomingChargesModalOpen,
  allTransactions,
  spentTransactions,
  bookedServices,
  upcomingBookings,
  userStats,
  onTopUpSuccess,
}: DashboardModalsProps) {
  return (
    <Suspense fallback={null}>
      <BalanceDetailsModal 
        open={balanceModalOpen}
        onOpenChange={setBalanceModalOpen}
        onTopUp={() => {
          setBalanceModalOpen(false);
          setTopUpModalOpen(true);
        }}
        onViewUpcomingCharges={setUpcomingChargesModalOpen ? () => {
          setBalanceModalOpen(false);
          setUpcomingChargesModalOpen(true);
        } : undefined}
        userStats={userStats}
      />
      
      <SpentDetailsModal
        open={spentModalOpen}
        onOpenChange={setSpentModalOpen}
        spentTransactions={spentTransactions}
      />
      
      <ServicesBookedModal
        open={servicesModalOpen || false}
        onOpenChange={setServicesModalOpen || (() => {})}
        bookedServices={bookedServices || []}
      />
      
      <CompletionRateModal
        open={completionModalOpen || false}
        onOpenChange={setCompletionModalOpen || (() => {})}
        services={bookedServices || []}
        overallRate={userStats.servicesBooked > 0 ? Math.round((userStats.completedSessions / userStats.servicesBooked) * 100) : 0}
      />
      
      <UpcomingSessionsModal
        open={upcomingModalOpen || false}
        onOpenChange={setUpcomingModalOpen || (() => {})}
        sessions={upcomingBookings || []}
      />
      
      <RecentTransactionsModal
        open={recentTransactionsModalOpen}
        onOpenChange={setRecentTransactionsModalOpen}
        transactions={allTransactions}
      />
      
      <RecentBookingsModal
        open={recentBookingsModalOpen || false}
        onOpenChange={setRecentBookingsModalOpen || (() => {})}
        bookings={bookedServices || []}
      />

      <TopUpModal 
        isOpen={topUpModalOpen}
        onClose={() => setTopUpModalOpen(false)}
        onSuccess={onTopUpSuccess}
      />
      
      {upcomingChargesModalOpen !== undefined && setUpcomingChargesModalOpen && (
        <UpcomingChargesModal
          open={upcomingChargesModalOpen}
          onOpenChange={setUpcomingChargesModalOpen}
        />
      )}
    </Suspense>
  );
}