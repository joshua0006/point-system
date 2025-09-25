import { memo, useMemo, useState, useCallback } from "react";
import { useOptimizedAdminData } from "@/hooks/useOptimizedAdminData";
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useAdminRealtime } from "@/hooks/admin/useAdminRealtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatsCard } from "@/components/ui/stats-card";
import { StatsSkeleton, TableSkeleton } from "@/components/ui/optimized-skeleton";
import { TopUpModal } from "@/components/admin/modals/TopUpModal";
import { DeductModal } from "@/components/admin/modals/DeductModal";
import { BillingProfileModal } from "@/components/admin/BillingProfileModal";
import { Users, Plus, Coins, RefreshCw, Minus, Receipt, UserX, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@/config/types";

interface OptimizedUserManagementProps {
  onUserAction?: (user: UserProfile, action: string) => void;
}

const MemoizedUserRow = memo(function UserRow({ 
  user, 
  onTopUp, 
  onDeduct, 
  onBilling, 
  onRevoke, 
  onDelete,
  getSubscriptionBadge,
  isSubscriptionLoading,
  getSubscription,
  fetchUserSubscription,
  setSelectedUser,
  setSubscriptionModalOpen,
  userRole
}: {
  user: UserProfile;
  onTopUp: (user: UserProfile) => void;
  onDeduct: (user: UserProfile) => void;
  onBilling: (user: UserProfile) => void;
  onRevoke: (user: UserProfile) => void;
  onDelete: (user: UserProfile) => void;
  getSubscriptionBadge: any;
  isSubscriptionLoading: any;
  getSubscription: any;
  fetchUserSubscription: any;
  setSelectedUser: any;
  setSubscriptionModalOpen: any;
  userRole: string;
}) {
  return (
    <TableRow key={user.id}>
      <TableCell>
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback>
              {(user.full_name || user.email).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">
              {user.full_name || "No name"}
            </div>
            <div className="text-sm text-muted-foreground">
              {user.email}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={
          user.role === 'master_admin' ? 'destructive' :
          user.role === 'admin' ? 'destructive' :
          user.role === 'consultant' ? 'default' : 'secondary'
        }>
          {user.role === 'master_admin' ? 'Master Admin' : user.role}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={
          user.approval_status === 'approved' ? 'default' :
          user.approval_status === 'pending' ? 'secondary' : 'destructive'
        }>
          {user.approval_status || 'approved'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="font-medium text-accent">
          {(user.flexi_credits_balance || 0).toLocaleString()} flexi credits
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {(() => {
            const subscription = getSubscription(user.user_id);
            const loading = isSubscriptionLoading(user.user_id);
            const badge = getSubscriptionBadge(
              subscription || { isActive: false, planName: 'No Plan', subscriptionTier: 'none', creditsPerMonth: 0 },
              loading
            );
            return <Badge variant={badge.variant}>{badge.text}</Badge>;
          })()}
          <Button
            onClick={async () => {
              setSelectedUser(user);
              setSubscriptionModalOpen(true);
              await fetchUserSubscription(user.user_id, user.email);
            }}
            size="sm"
            variant="outline"
          >
            View Sub
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-muted-foreground">
          {new Date(user.created_at).toLocaleDateString()}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button onClick={() => onTopUp(user)} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
          <Button
            onClick={() => onDeduct(user)}
            size="sm"
            variant="outline"
            disabled={(user.flexi_credits_balance || 0) <= -500}
          >
            <Minus className="w-4 h-4 mr-1" />
            Deduct
          </Button>
          {user.approval_status === 'approved' && user.role !== 'admin' && user.role !== 'master_admin' && (
            <Button onClick={() => onRevoke(user)} size="sm" variant="destructive">
              <UserX className="w-4 h-4 mr-1" />
              Revoke
            </Button>
          )}
          <Button onClick={() => onBilling(user)} size="sm" variant="outline">
            <Receipt className="w-4 h-4 mr-1" />
            Billing
          </Button>
          {/* Delete button logic */}
          {((userRole === 'master_admin' && user.role !== 'master_admin') || 
            (userRole === 'admin' && user.role !== 'admin' && user.role !== 'master_admin')) && (
            <Button onClick={() => onDelete(user)} size="sm" variant="destructive">
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});

export const OptimizedUserManagement = memo(function OptimizedUserManagement({ 
  onUserAction 
}: OptimizedUserManagementProps) {
  const { users, usersLoading, refreshUsers, updateUser } = useOptimizedAdminData();
  const { fetchUserSubscription, getSubscriptionBadge, isLoading: isSubscriptionLoading, getSubscription } = useUserSubscription();
  const { toast } = useToast();
  
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [deductModalOpen, setDeductModalOpen] = useState(false);
  const [billingProfileModalOpen, setBillingProfileModalOpen] = useState(false);
  
  // Set up real-time updates with stable callback
  const handleDataChange = useCallback(() => {
    refreshUsers();
  }, [refreshUsers]);
  
  useAdminRealtime({ 
    onDataChange: handleDataChange,
    enabled: true 
  });

  // Memoized stats calculations
  const stats = useMemo(() => ({
    totalUsers: users.length,
    totalFlexiCredits: users.reduce((sum, user) => sum + (user.flexi_credits_balance || 0), 0),
    adminUsers: users.filter(u => u.role === 'admin').length,
    consultantUsers: users.filter(u => u.role === 'consultant').length,
  }), [users]);

  // Memoized action handlers
  const actionHandlers = useMemo(() => ({
    handleTopUp: (user: UserProfile) => {
      setSelectedUser(user);
      setTopUpModalOpen(true);
    },
    handleDeduct: (user: UserProfile) => {
      setSelectedUser(user);
      setDeductModalOpen(true);
    },
    handleBilling: (user: UserProfile) => {
      setSelectedUser(user);
      setBillingProfileModalOpen(true);
    },
    handleRevoke: (user: UserProfile) => {
      onUserAction?.(user, 'revoke');
    },
    handleDelete: (user: UserProfile) => {
      onUserAction?.(user, 'delete');
    },
  }), [onUserAction]);

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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle="Registered users"
          icon={Users}
        />
        
        <StatsCard
          title="Total Flexi Credits"
          value={stats.totalFlexiCredits.toLocaleString()}
          subtitle="Across all users"
          icon={Coins}
          className="text-accent"
        />
        
        <StatsCard
          title="Consultants"
          value={stats.consultantUsers}
          subtitle="Active consultants"
          className="text-success"
        />
        
        <StatsCard
          title="Admins"
          value={stats.adminUsers}
          subtitle="System admins"
          className="text-destructive"
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>User Management</CardTitle>
            <Button onClick={() => refreshUsers()} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Flexi Credits Balance</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Member Since</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <MemoizedUserRow
                  key={user.id}
                  user={user}
                  onTopUp={actionHandlers.handleTopUp}
                  onDeduct={actionHandlers.handleDeduct}
                  onBilling={actionHandlers.handleBilling}
                  onRevoke={actionHandlers.handleRevoke}
                  onDelete={actionHandlers.handleDelete}
                  getSubscriptionBadge={getSubscriptionBadge}
                  isSubscriptionLoading={isSubscriptionLoading}
                  getSubscription={getSubscription}
                  fetchUserSubscription={fetchUserSubscription}
                  setSelectedUser={setSelectedUser}
                  setSubscriptionModalOpen={setSubscriptionModalOpen}
                  userRole="master_admin" // This should come from auth context
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedUser && (
        <>
          <TopUpModal
            user={selectedUser}
            open={topUpModalOpen}
            onOpenChange={setTopUpModalOpen}
            onSuccess={() => {
              refreshUsers();
              setTopUpModalOpen(false);
            }}
          />
          <DeductModal
            user={selectedUser}
            open={deductModalOpen}
            onOpenChange={setDeductModalOpen}
            onSuccess={() => {
              refreshUsers();
              setDeductModalOpen(false);
            }}
          />
          <BillingProfileModal
            user={selectedUser}
            open={billingProfileModalOpen}
            onOpenChange={setBillingProfileModalOpen}
          />
          
          {/* Subscription Modal */}
          <Dialog open={subscriptionModalOpen} onOpenChange={setSubscriptionModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Subscription Details</DialogTitle>
                <DialogDescription>
                  Subscription information for {selectedUser.full_name || selectedUser.email}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    {(() => {
                      const subscription = getSubscription(selectedUser.user_id);
                      const loading = isSubscriptionLoading(selectedUser.user_id);
                      
                      if (loading) {
                        return <div className="text-lg font-semibold">Loading...</div>;
                      }
                      
                      if (!subscription || !subscription.isActive) {
                        return <div className="text-lg font-semibold text-muted-foreground">Inactive</div>;
                      }
                      
                      return <div className="text-lg font-semibold text-green-600">Active</div>;
                    })()}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Current Balance</label>
                    <div className="text-lg font-semibold text-accent">{(selectedUser.flexi_credits_balance || 0).toLocaleString()} flexi credits</div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
});