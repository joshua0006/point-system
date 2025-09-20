import { useState, useCallback } from 'react';

export type ModalType = 
  | 'balance'
  | 'spent'
  | 'services'
  | 'completion'
  | 'upcoming'
  | 'recentTransactions'
  | 'recentBookings'
  | 'topUp'
  | 'upcomingCharges';

interface ModalState {
  balance: boolean;
  spent: boolean;
  services: boolean;
  completion: boolean;
  upcoming: boolean;
  recentTransactions: boolean;
  recentBookings: boolean;
  topUp: boolean;
  upcomingCharges: boolean;
}

export function useDashboardModals() {
  const [modalState, setModalState] = useState<ModalState>({
    balance: false,
    spent: false,
    services: false,
    completion: false,
    upcoming: false,
    recentTransactions: false,
    recentBookings: false,
    topUp: false,
    upcomingCharges: false,
  });

  const openModal = useCallback((type: ModalType) => {
    setModalState(prev => ({ ...prev, [type]: true }));
  }, []);

  const closeModal = useCallback((type: ModalType) => {
    setModalState(prev => ({ ...prev, [type]: false }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModalState({
      balance: false,
      spent: false,
      services: false,
      completion: false,
      upcoming: false,
      recentTransactions: false,
      recentBookings: false,
      topUp: false,
      upcomingCharges: false,
    });
  }, []);

  const isModalOpen = useCallback((type: ModalType) => {
    return modalState[type];
  }, [modalState]);

  return {
    modalState,
    openModal,
    closeModal,
    closeAllModals,
    isModalOpen,
  };
}