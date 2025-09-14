import { useState } from "react";

export function useModalState() {
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [spentModalOpen, setSpentModalOpen] = useState(false);
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [upcomingModalOpen, setUpcomingModalOpen] = useState(false);
  const [recentTransactionsModalOpen, setRecentTransactionsModalOpen] = useState(false);
  const [recentBookingsModalOpen, setRecentBookingsModalOpen] = useState(false);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [upcomingChargesModalOpen, setUpcomingChargesModalOpen] = useState(false);

  const closeAllModals = () => {
    setBalanceModalOpen(false);
    setSpentModalOpen(false);
    setServicesModalOpen(false);
    setCompletionModalOpen(false);
    setUpcomingModalOpen(false);
    setRecentTransactionsModalOpen(false);
    setRecentBookingsModalOpen(false);
    setTopUpModalOpen(false);
    setUpcomingChargesModalOpen(false);
  };

  return {
    // Modal states
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
    
    // Utility
    closeAllModals,
  };
}