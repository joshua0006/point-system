import { memo } from "react";
import { TopUpModal } from "@/components/admin/modals/TopUpModal";
import { DeductModal } from "@/components/admin/modals/DeductModal";
import { BillingProfileModal } from "@/components/admin/BillingProfileModal";
import { UserDetailsModal } from "@/components/admin/modals/UserDetailsModal";
import { UserSubscriptionModal } from "./UserSubscriptionModal";
import { ServiceAssignmentModal } from "@/components/admin/modals/ServiceAssignmentModal";
import type { UserProfile } from "@/config/types";

interface UserManagementModalsProps {
  selectedUser: UserProfile | null;
  modalsState: {
    topUp: boolean;
    deduct: boolean;
    billing: boolean;
    details: boolean;
    subscription: boolean;
    serviceAssignment: boolean;
  };
  closeModal: (modalType: keyof UserManagementModalsProps['modalsState']) => void;
  onRefreshUsers: () => void;
  getSubscription: (userId: string) => any;
  isSubscriptionLoading: (userId: string) => boolean;
}

export const UserManagementModals = memo(function UserManagementModals({
  selectedUser,
  modalsState,
  closeModal,
  onRefreshUsers,
  getSubscription,
  isSubscriptionLoading
}: UserManagementModalsProps) {
  if (!selectedUser) return null;

  const handleSuccess = (modalType: keyof typeof modalsState) => () => {
    onRefreshUsers();
    closeModal(modalType);
  };

  return (
    <>
      <TopUpModal
        user={selectedUser}
        open={modalsState.topUp}
        onOpenChange={(open) => !open && closeModal('topUp')}
        onSuccess={handleSuccess('topUp')}
      />
      
      <DeductModal
        user={selectedUser}
        open={modalsState.deduct}
        onOpenChange={(open) => !open && closeModal('deduct')}
        onSuccess={handleSuccess('deduct')}
      />
      
      <BillingProfileModal
        user={selectedUser}
        open={modalsState.billing}
        onOpenChange={(open) => !open && closeModal('billing')}
      />
      
      <UserDetailsModal
        user={selectedUser}
        open={modalsState.details}
        onOpenChange={(open) => !open && closeModal('details')}
      />
      
      <UserSubscriptionModal
        user={selectedUser}
        open={modalsState.subscription}
        onOpenChange={(open) => !open && closeModal('subscription')}
        getSubscription={getSubscription}
        isSubscriptionLoading={isSubscriptionLoading}
      />

      <ServiceAssignmentModal
        user={selectedUser}
        open={modalsState.serviceAssignment}
        onOpenChange={(open) => !open && closeModal('serviceAssignment')}
        onSuccess={handleSuccess('serviceAssignment')}
      />
    </>
  );
});