import { useDashboardModals } from './useModal';

// Legacy hook for backward compatibility
export function useModalState() {
  const { openModal, closeModal, closeAllModals, isModalOpen } = useDashboardModals();

  return {
    // Modal states
    balanceModalOpen: isModalOpen('balance'),
    setBalanceModalOpen: (open: boolean) => open ? openModal('balance') : closeModal('balance'),
    spentModalOpen: isModalOpen('spent'),
    setSpentModalOpen: (open: boolean) => open ? openModal('spent') : closeModal('spent'),
    servicesModalOpen: isModalOpen('services'),
    setServicesModalOpen: (open: boolean) => open ? openModal('services') : closeModal('services'),
    completionModalOpen: isModalOpen('completion'),
    setCompletionModalOpen: (open: boolean) => open ? openModal('completion') : closeModal('completion'),
    upcomingModalOpen: isModalOpen('upcoming'),
    setUpcomingModalOpen: (open: boolean) => open ? openModal('upcoming') : closeModal('upcoming'),
    recentTransactionsModalOpen: isModalOpen('recentTransactions'),
    setRecentTransactionsModalOpen: (open: boolean) => open ? openModal('recentTransactions') : closeModal('recentTransactions'),
    recentBookingsModalOpen: isModalOpen('recentBookings'),
    setRecentBookingsModalOpen: (open: boolean) => open ? openModal('recentBookings') : closeModal('recentBookings'),
    topUpModalOpen: isModalOpen('topUp'),
    setTopUpModalOpen: (open: boolean) => open ? openModal('topUp') : closeModal('topUp'),
    upcomingChargesModalOpen: isModalOpen('upcomingCharges'),
    setUpcomingChargesModalOpen: (open: boolean) => open ? openModal('upcomingCharges') : closeModal('upcomingCharges'),
    
    // Utility
    closeAllModals,
  };
}