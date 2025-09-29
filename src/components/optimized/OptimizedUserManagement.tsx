import { memo, useState, useCallback, useEffect } from "react";
import { useOptimizedAdminData } from "@/hooks/useOptimizedAdminData";
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useAdminRealtime } from "@/hooks/admin/useAdminRealtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsSkeleton, TableSkeleton } from "@/components/ui/optimized-skeleton";
import { UserStatsCards } from "@/components/admin/users/UserStatsCards";
import { UsersTable } from "@/components/admin/users/UsersTable";
import { UserManagementModals } from "@/components/admin/users/UserManagementModals";
import { useAuth } from "@/contexts/AuthContext";
import type { UserProfile } from "@/config/types";

interface OptimizedUserManagementProps {
  onUserAction?: (user: UserProfile, action: string) => void;
}


export const OptimizedUserManagement = memo(function OptimizedUserManagement({ 
  onUserAction 
}: OptimizedUserManagementProps) {
  const { users, usersLoading, refreshUsers } = useOptimizedAdminData();
  const { fetchUserSubscription, isLoading: isSubscriptionLoading, getSubscription } = useUserSubscription();
  const { profile } = useAuth();
  
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [deductModalOpen, setDeductModalOpen] = useState(false);
  const [billingProfileModalOpen, setBillingProfileModalOpen] = useState(false);
  const [userDetailsModalOpen, setUserDetailsModalOpen] = useState(false);
  
  // Set up real-time updates
  const handleDataChange = useCallback(() => {
    refreshUsers();
  }, [refreshUsers]);
  
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
    setSelectedUser(user);
    setTopUpModalOpen(true);
  }, []);

  const handleDeduct = useCallback((user: UserProfile) => {
    setSelectedUser(user);
    setDeductModalOpen(true);
  }, []);

  const handleBilling = useCallback((user: UserProfile) => {
    setSelectedUser(user);
    setBillingProfileModalOpen(true);
  }, []);

  const handleRevoke = useCallback((user: UserProfile) => {
    onUserAction?.(user, 'revoke');
  }, [onUserAction]);

  const handleDelete = useCallback((user: UserProfile) => {
    onUserAction?.(user, 'delete');
  }, [onUserAction]);

  const handleUserDetails = useCallback((user: UserProfile) => {
    setSelectedUser(user);
    setUserDetailsModalOpen(true);
  }, []);

  const handleViewSubscription = useCallback(async (user: UserProfile) => {
    setSelectedUser(user);
    setSubscriptionModalOpen(true);
    await fetchUserSubscription(user.user_id, user.email);
  }, [fetchUserSubscription]);

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
        users={users}
        onRefresh={refreshUsers}
        onTopUp={handleTopUp}
        onDeduct={handleDeduct}
        onBilling={handleBilling}
        onRevoke={handleRevoke}
        onDelete={handleDelete}
        onUserDetails={handleUserDetails}
        onViewSubscription={handleViewSubscription}
        getSubscription={getSubscription}
        isSubscriptionLoading={isSubscriptionLoading}
        userRole={profile?.role || 'user'}
      />

      <UserManagementModals
        selectedUser={selectedUser}
        topUpModalOpen={topUpModalOpen}
        setTopUpModalOpen={setTopUpModalOpen}
        deductModalOpen={deductModalOpen}
        setDeductModalOpen={setDeductModalOpen}
        billingProfileModalOpen={billingProfileModalOpen}
        setBillingProfileModalOpen={setBillingProfileModalOpen}
        userDetailsModalOpen={userDetailsModalOpen}
        setUserDetailsModalOpen={setUserDetailsModalOpen}
        subscriptionModalOpen={subscriptionModalOpen}
        setSubscriptionModalOpen={setSubscriptionModalOpen}
        onRefreshUsers={refreshUsers}
        getSubscription={getSubscription}
        isSubscriptionLoading={isSubscriptionLoading}
      />
    </div>
  );
});