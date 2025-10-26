import { memo, useCallback, useEffect, useState, useMemo } from "react";
import { useAdminUsers } from "@/hooks/admin/useAdminUsers";
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useAdminRealtime } from "@/hooks/admin/useAdminRealtime";
import { useUserActions } from "@/hooks/admin/useUserActions";
import { useUserManagementModals } from "@/hooks/admin/useUserManagementModals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsSkeleton, TableSkeleton } from "@/components/ui/optimized-skeleton";
import { UserStatsCards } from "./UserStatsCards";
import { UsersTable } from "./UsersTable";
import { UserManagementModals } from "./UserManagementModals";
import { AdminAwardCreditsModal } from "../modals/AdminAwardCreditsModal";
import { useAuth } from "@/contexts/AuthContext";
import type { UserProfile } from "@/config/types";

interface UserManagementContainerProps {
  onUserAction?: (user: UserProfile, action: string) => void;
}

export const UserManagementContainer = memo(function UserManagementContainer({ 
  onUserAction 
}: UserManagementContainerProps) {
  const { users, usersLoading, refreshAllUsers } = useAdminUsers();
  const { fetchUserSubscription, isLoading: isSubscriptionLoading, getSubscription } = useUserSubscription();
  const { profile } = useAuth();
  const { revokeUser, deleteUser, toggleHideUser } = useUserActions();
  const { 
    selectedUser, 
    modalsState, 
    openModal, 
    closeModal, 
    setSelectedUser 
  } = useUserManagementModals();

  const [awardModalOpen, setAwardModalOpen] = useState(false);
  const [selectedUserForAward, setSelectedUserForAward] = useState<UserProfile | null>(null);
  const [showHiddenUsers, setShowHiddenUsers] = useState(false);

  // Filter users based on hidden status
  const filteredUsers = useMemo(() => {
    if (showHiddenUsers) return users;
    return users.filter(user => !user.is_hidden);
  }, [users, showHiddenUsers]);

  const hiddenUsersCount = useMemo(() => {
    return users.filter(user => user.is_hidden).length;
  }, [users]);
  
  // Set up real-time updates
  const handleDataChange = useCallback(() => {
    refreshAllUsers();
  }, [refreshAllUsers]);
  
  useAdminRealtime({ 
    onDataChange: handleDataChange,
    enabled: true 
  });

  // Prefetch subscription info for listed users
  useEffect(() => {
    if (!users || users.length === 0) return;
    const subset = users.slice(0, 50);
    subset.forEach((u) => {
      fetchUserSubscription(u.user_id, u.email);
    });
  }, [users, fetchUserSubscription]);

  // Action handlers
  const handleTopUp = useCallback((user: UserProfile) => {
    openModal('topUp', user);
  }, [openModal]);

  const handleDeduct = useCallback((user: UserProfile) => {
    openModal('deduct', user);
  }, [openModal]);

  const handleBilling = useCallback((user: UserProfile) => {
    openModal('billing', user);
  }, [openModal]);

  const handleRevoke = useCallback(async (user: UserProfile) => {
    const success = await revokeUser(user.user_id);
    if (success) {
      refreshAllUsers();
    }
    onUserAction?.(user, 'revoke');
  }, [revokeUser, refreshAllUsers, onUserAction]);

  const handleDelete = useCallback(async (user: UserProfile) => {
    const success = await deleteUser(user.user_id);
    if (success) {
      refreshAllUsers();
    }
    onUserAction?.(user, 'delete');
  }, [deleteUser, refreshAllUsers, onUserAction]);

  const handleUserDetails = useCallback((user: UserProfile) => {
    openModal('details', user);
  }, [openModal]);

  const handleViewSubscription = useCallback(async (user: UserProfile) => {
    setSelectedUser(user);
    openModal('subscription', user);
    await fetchUserSubscription(user.user_id, user.email);
  }, [openModal, setSelectedUser, fetchUserSubscription]);

  const handleServiceAssignment = useCallback((user: UserProfile) => {
    openModal('serviceAssignment', user);
  }, [openModal]);

  const handleAwardCredits = useCallback((user: UserProfile) => {
    setSelectedUserForAward(user);
    setAwardModalOpen(true);
  }, []);

  const handleToggleHide = useCallback(async (user: UserProfile) => {
    const success = await toggleHideUser(user.user_id);
    if (success) {
      refreshAllUsers();
    }
  }, [toggleHideUser, refreshAllUsers]);

  if (usersLoading) {
    return (
      <div className="space-y-6">
        <StatsSkeleton />
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <TableSkeleton rows={10} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserStatsCards users={users} />
      
      <UsersTable
        users={filteredUsers}
        onRefresh={refreshAllUsers}
        onTopUp={handleTopUp}
        onDeduct={handleDeduct}
        onBilling={handleBilling}
        onRevoke={handleRevoke}
        onDelete={handleDelete}
        onUserDetails={handleUserDetails}
        onViewSubscription={handleViewSubscription}
        onServiceAssignment={handleServiceAssignment}
        onAwardCredits={handleAwardCredits}
        onToggleHide={handleToggleHide}
        getSubscription={getSubscription}
        isSubscriptionLoading={isSubscriptionLoading}
        userRole={profile?.role || 'user'}
        showHiddenUsers={showHiddenUsers}
        onToggleShowHidden={() => setShowHiddenUsers(!showHiddenUsers)}
        hiddenUsersCount={hiddenUsersCount}
      />

      <UserManagementModals
        selectedUser={selectedUser}
        modalsState={modalsState}
        closeModal={closeModal}
        onRefreshUsers={refreshAllUsers}
        getSubscription={getSubscription}
        isSubscriptionLoading={isSubscriptionLoading}
      />

      {selectedUserForAward && (
        <AdminAwardCreditsModal
          open={awardModalOpen}
          onOpenChange={setAwardModalOpen}
          userId={selectedUserForAward.user_id}
          userName={selectedUserForAward.full_name || 'User'}
          userEmail={selectedUserForAward.email}
          currentBalance={selectedUserForAward.flexi_credits_balance}
          lockedBalance={0}
        />
      )}
    </div>
  );
});