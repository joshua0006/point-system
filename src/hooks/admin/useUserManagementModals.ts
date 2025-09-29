import { useState, useCallback } from "react";
import type { UserProfile } from "@/config/types";

export function useUserManagementModals() {
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [modalsState, setModalsState] = useState({
    topUp: false,
    deduct: false,
    billing: false,
    details: false,
    subscription: false,
  });

  const openModal = useCallback((modalType: keyof typeof modalsState, user: UserProfile) => {
    setSelectedUser(user);
    setModalsState(prev => ({
      ...prev,
      [modalType]: true,
    }));
  }, []);

  const closeModal = useCallback((modalType: keyof typeof modalsState) => {
    setModalsState(prev => ({
      ...prev,
      [modalType]: false,
    }));
  }, []);

  const closeAllModals = useCallback(() => {
    setSelectedUser(null);
    setModalsState({
      topUp: false,
      deduct: false,
      billing: false,
      details: false,
      subscription: false,
    });
  }, []);

  return {
    selectedUser,
    modalsState,
    openModal,
    closeModal,
    closeAllModals,
    setSelectedUser,
  };
}