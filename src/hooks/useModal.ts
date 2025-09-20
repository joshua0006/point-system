import { useState, useCallback } from 'react';

type ModalState = {
  isOpen: boolean;
  data?: any;
};

type ModalConfig<T = any> = {
  [key: string]: T;
};

export function useModal<T extends ModalConfig = ModalConfig>() {
  const [modals, setModals] = useState<{ [K in keyof T]: ModalState }>({} as any);

  const openModal = useCallback(<K extends keyof T>(modalKey: K, data?: T[K]) => {
    setModals(prev => ({
      ...prev,
      [modalKey]: { isOpen: true, data }
    }));
  }, []);

  const closeModal = useCallback(<K extends keyof T>(modalKey: K) => {
    setModals(prev => ({
      ...prev,
      [modalKey]: { isOpen: false, data: null }
    }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(key => {
        newState[key as keyof T] = { isOpen: false, data: null };
      });
      return newState;
    });
  }, []);

  const isModalOpen = useCallback(<K extends keyof T>(modalKey: K): boolean => {
    return modals[modalKey]?.isOpen || false;
  }, [modals]);

  const getModalData = useCallback(<K extends keyof T>(modalKey: K): T[K] | null => {
    return modals[modalKey]?.data || null;
  }, [modals]);

  return {
    openModal,
    closeModal,
    closeAllModals,
    isModalOpen,
    getModalData,
  };
}

// Specific hook for dashboard modals
export function useDashboardModals() {
  return useModal<{
    balance: any;
    spent: any;
    services: any;
    completion: any;
    upcoming: any;
    recentTransactions: any;
    recentBookings: any;
    topUp: any;
    upcomingCharges: any;
  }>();
}