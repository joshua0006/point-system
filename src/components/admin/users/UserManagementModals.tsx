import { memo } from "react";
import { TopUpModal } from "@/components/admin/modals/TopUpModal";
import { DeductModal } from "@/components/admin/modals/DeductModal";
import { BillingProfileModal } from "@/components/admin/BillingProfileModal";
import { UserDetailsModal } from "@/components/admin/modals/UserDetailsModal";
import { UserSubscriptionModal } from "./UserSubscriptionModal";
import type { UserProfile } from "@/config/types";

interface UserManagementModalsProps {
  selectedUser: UserProfile | null;
  topUpModalOpen: boolean;
  setTopUpModalOpen: (open: boolean) => void;
  deductModalOpen: boolean;
  setDeductModalOpen: (open: boolean) => void;
  billingProfileModalOpen: boolean;
  setBillingProfileModalOpen: (open: boolean) => void;
  userDetailsModalOpen: boolean;
  setUserDetailsModalOpen: (open: boolean) => void;
  subscriptionModalOpen: boolean;
  setSubscriptionModalOpen: (open: boolean) => void;
  onRefreshUsers: () => void;
  getSubscription: (userId: string) => any;
  isSubscriptionLoading: (userId: string) => boolean;
}

export const UserManagementModals = memo(function UserManagementModals({
  selectedUser,
  topUpModalOpen,
  setTopUpModalOpen,
  deductModalOpen,
  setDeductModalOpen,
  billingProfileModalOpen,
  setBillingProfileModalOpen,
  userDetailsModalOpen,
  setUserDetailsModalOpen,
  subscriptionModalOpen,
  setSubscriptionModalOpen,
  onRefreshUsers,
  getSubscription,
  isSubscriptionLoading
}: UserManagementModalsProps) {
  if (!selectedUser) return null;

  const handleSuccess = (modalSetter: (open: boolean) => void) => () => {
    onRefreshUsers();
    modalSetter(false);
  };

  return (
    <>
      <TopUpModal
        user={selectedUser}
        open={topUpModalOpen}
        onOpenChange={setTopUpModalOpen}
        onSuccess={handleSuccess(setTopUpModalOpen)}
      />
      
      <DeductModal
        user={selectedUser}
        open={deductModalOpen}
        onOpenChange={setDeductModalOpen}
        onSuccess={handleSuccess(setDeductModalOpen)}
      />
      
      <BillingProfileModal
        user={selectedUser}
        open={billingProfileModalOpen}
        onOpenChange={setBillingProfileModalOpen}
      />
      
      <UserDetailsModal
        user={selectedUser}
        open={userDetailsModalOpen}
        onOpenChange={setUserDetailsModalOpen}
      />
      
      <UserSubscriptionModal
        user={selectedUser}
        open={subscriptionModalOpen}
        onOpenChange={setSubscriptionModalOpen}
        getSubscription={getSubscription}
        isSubscriptionLoading={isSubscriptionLoading}
      />
    </>
  );
});