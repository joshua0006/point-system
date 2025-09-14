import { useState, useEffect } from "react";
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { BillingProfileModal } from "@/components/admin/BillingProfileModal";
import { Users, Plus, Coins, RefreshCw, UserX, Minus, AlertTriangle, Receipt, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: 'user' | 'consultant' | 'admin' | 'sales' | 'master_admin';
  flexi_credits_balance: number;
  created_at: string;
  updated_at: string;
  approval_status?: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
}

interface TopUpModalProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function TopUpModal({ user, open, onOpenChange, onSuccess }: TopUpModalProps) {
  const [flexiCredits, setFlexiCredits] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTopUp = async () => {
    console.log('handleTopUp called with flexi credits:', flexiCredits);
    const creditsAmount = parseFloat(flexiCredits);
    console.log('creditsAmount parsed:', creditsAmount);
    
    if (isNaN(creditsAmount) || creditsAmount <= 0) {
      console.log('Validation failed:', { isNaN: isNaN(creditsAmount), lessThanOrEqualZero: creditsAmount <= 0 });
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid number of flexi credits to add.",
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for adding flexi credits.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'topup_points',
          userId: user.user_id,
          points: creditsAmount,
          reason: reason.trim()
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added ${creditsAmount} flexi credits to ${user.full_name || user.email}'s account.`,
      });

      setFlexiCredits("");
      setReason("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Top-up error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add flexi credits. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Top Up Flexi Credits</DialogTitle>
          <DialogDescription>
            Add flexi credits to {user.full_name || user.email}'s account
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Balance</label>
            <div className="text-2xl font-bold text-accent">{(user.flexi_credits_balance || 0)} flexi credits</div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Flexi Credits to Add</label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={flexiCredits}
              onChange={(e) => setFlexiCredits(e.target.value)}
              min="0.1"
              step="0.1"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for Adding Credits *</label>
            <Textarea
              placeholder="Explain why flexi credits are being added..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-800 text-sm">
              <Plus className="w-4 h-4" />
              <span className="font-medium">Adding Credits</span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              This will permanently add flexi credits to the user's account and send email notifications.
            </p>
          </div>
          <Button 
            onClick={handleTopUp} 
            disabled={loading || !flexiCredits || flexiCredits.trim() === '' || parseFloat(flexiCredits) <= 0 || !reason.trim()}
            className="w-full"
          >
            {loading ? "Adding..." : `Add ${flexiCredits || 0} Flexi Credits`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DeductModalProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function DeductModal({ user, open, onOpenChange, onSuccess }: DeductModalProps) {
  const [flexiCredits, setFlexiCredits] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDeduct = async () => {
    const creditsAmount = parseFloat(flexiCredits);
    if (!creditsAmount || creditsAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid number of flexi credits to deduct.",
        variant: "destructive",
      });
      return;
    }

    const balanceAfter = (user.flexi_credits_balance || 0) - creditsAmount;
    if (balanceAfter < -1000) {
      toast({
        title: "Balance Limit Exceeded",
        description: `This would bring user's balance to ${balanceAfter} flexi credits. Minimum allowed balance is -1000.`,
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for deducting flexi credits.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'deduct_points',
          userId: user.user_id,
          points: creditsAmount,
          reason: reason.trim()
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Deducted ${creditsAmount} flexi credits from ${user.full_name || user.email}'s account.`,
      });

      setFlexiCredits("");
      setReason("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Deduct error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to deduct flexi credits. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Minus className="w-5 h-5" />
            Deduct Flexi Credits
          </DialogTitle>
          <DialogDescription>
            Remove flexi credits from {user.full_name || user.email}'s account
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Balance</label>
            <div className="text-2xl font-bold text-accent">{(user.flexi_credits_balance || 0)} flexi credits</div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Flexi Credits to Deduct</label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={flexiCredits}
              onChange={(e) => setFlexiCredits(e.target.value)}
              min="0.1"
              max={(user.flexi_credits_balance || 0)}
              step="0.1"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for Deduction *</label>
            <Textarea
              placeholder="Explain why flexi credits are being deducted..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-800 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Warning</span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              This action cannot be undone. Flexi credits will be permanently removed from the user's account.
            </p>
          </div>
          <Button 
            onClick={handleDeduct} 
            disabled={loading || !flexiCredits || !reason.trim()}
            variant="destructive"
            className="w-full"
          >
            {loading ? "Deducting..." : `Deduct ${flexiCredits || 0} Flexi Credits`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UserManagement() {
  const { profile } = useAuth();
  const { fetchUserSubscription, getSubscriptionBadge, isLoading: isSubscriptionLoading, getSubscription } = useUserSubscription();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [deductModalOpen, setDeductModalOpen] = useState(false);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [billingProfileModalOpen, setBillingProfileModalOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'list_users' }
      });

      if (error) throw error;

      setUsers(data.users || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'admin' || profile?.role === 'master_admin') {
      fetchUsers();
    }
  }, [profile]);

  if (profile?.role !== 'admin' && profile?.role !== 'master_admin') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Access denied. Admin privileges required.
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalUsers = users.length;
  const totalFlexiCredits = users.reduce((sum, user) => sum + (user.flexi_credits_balance || 0), 0);
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const consultantUsers = users.filter(u => u.role === 'consultant').length;

  const handleTopUpClick = (user: UserProfile) => {
    setSelectedUser(user);
    setTopUpModalOpen(true);
  };

  const handleDeductClick = (user: UserProfile) => {
    setSelectedUser(user);
    setDeductModalOpen(true);
  };

  const handleBillingClick = (user: UserProfile) => {
    setSelectedUser(user);
    setBillingProfileModalOpen(true);
  };

  const handleRevokeClick = (user: UserProfile) => {
    setSelectedUser(user);
    setRevokeDialogOpen(true);
  };

  const handleDeleteClick = (user: UserProfile) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleRevokeAccess = async () => {
    if (!selectedUser || !revokeReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for revoking access.",
        variant: "destructive",
      });
      return;
    }

    setRevokeLoading(true);
    try {
      const { error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'revoke_access',
          userId: selectedUser.user_id,
          reason: revokeReason.trim()
        }
      });

      if (error) throw error;

      toast({
        title: "Access Revoked",
        description: `Successfully revoked access for ${selectedUser.full_name || selectedUser.email}.`,
      });

      setRevokeDialogOpen(false);
      setRevokeReason("");
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Revoke error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to revoke access. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRevokeLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !deleteReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for deleting the user.",
        variant: "destructive",
      });
      return;
    }

    setDeleteLoading(true);
    try {
      const { error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'delete_user',
          userId: selectedUser.user_id,
          reason: deleteReason.trim()
        }
      });

      if (error) throw error;

      toast({
        title: "User Deleted",
        description: `Successfully deleted user ${selectedUser.full_name || selectedUser.email}.`,
      });

      setDeleteDialogOpen(false);
      setDeleteReason("");
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Total Users
              <Users className="w-4 h-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Total Flexi Credits
              <Coins className="w-4 h-4 text-accent" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{totalFlexiCredits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Consultants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{consultantUsers}</div>
            <p className="text-xs text-muted-foreground">Active consultants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{adminUsers}</div>
            <p className="text-xs text-muted-foreground">System admins</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>User Management</CardTitle>
            <Button onClick={fetchUsers} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading users...</div>
            </div>
          ) : (
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
                              // Fetch subscription data when modal opens
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
                        <Button
                          onClick={() => handleTopUpClick(user)}
                          size="sm"
                          variant="outline"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                         <Button
                           onClick={() => handleDeductClick(user)}
                           size="sm"
                           variant="outline"
                           disabled={(user.flexi_credits_balance || 0) === 0}
                         >
                          <Minus className="w-4 h-4 mr-1" />
                          Deduct
                        </Button>
                         {user.approval_status === 'approved' && user.role !== 'admin' && user.role !== 'master_admin' && (
                          <Button
                            onClick={() => handleRevokeClick(user)}
                            size="sm"
                            variant="destructive"
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Revoke
                          </Button>
                         )}
                         <Button
                           onClick={() => handleBillingClick(user)}
                           size="sm"
                           variant="outline"
                         >
                           <Receipt className="w-4 h-4 mr-1" />
                           Billing
                         </Button>
                         {/* Master admin can delete anyone except themselves and other master admins */}
                         {profile?.role === 'master_admin' && user.user_id !== profile.user_id && user.role !== 'master_admin' && (
                           <Button
                             onClick={() => handleDeleteClick(user)}
                             size="sm"
                             variant="destructive"
                           >
                             <Trash2 className="w-4 h-4 mr-1" />
                             Delete
                           </Button>
                         )}
                         {/* Regular admin can only delete non-admin users */}
                         {profile?.role === 'admin' && user.role !== 'admin' && user.role !== 'master_admin' && (
                           <Button
                             onClick={() => handleDeleteClick(user)}
                             size="sm"
                             variant="destructive"
                           >
                             <Trash2 className="w-4 h-4 mr-1" />
                             Delete
                           </Button>
                         )}
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals and Dialogs */}
      {selectedUser && (
        <>
          <TopUpModal
            user={selectedUser}
            open={topUpModalOpen}
            onOpenChange={setTopUpModalOpen}
            onSuccess={fetchUsers}
          />
          <DeductModal
            user={selectedUser}
            open={deductModalOpen}
            onOpenChange={setDeductModalOpen}
            onSuccess={fetchUsers}
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
                 {(() => {
                   const subscription = getSubscription(selectedUser.user_id);
                   const loading = isSubscriptionLoading(selectedUser.user_id);
                   
                   if (loading) {
                     return <div className="text-sm text-muted-foreground">Loading subscription details...</div>;
                   }
                   
                   if (!subscription || !subscription.isActive) {
                     return <div className="text-sm text-muted-foreground">No active subscription plan found for this user.</div>;
                   }
                   
                   return (
                     <div className="space-y-3">
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <label className="text-sm font-medium text-muted-foreground">Plan Name</label>
                           <div className="text-sm font-medium">{subscription.planName}</div>
                         </div>
                         <div>
                           <label className="text-sm font-medium text-muted-foreground">Monthly Credits</label>
                           <div className="text-sm font-medium">{subscription.creditsPerMonth.toLocaleString()}</div>
                         </div>
                       </div>
                       {subscription.endDate && (
                         <div>
                           <label className="text-sm font-medium text-muted-foreground">Next Renewal</label>
                           <div className="text-sm font-medium">{new Date(subscription.endDate).toLocaleDateString()}</div>
                         </div>
                       )}
                       {subscription.subscriptionId && (
                         <div>
                           <label className="text-sm font-medium text-muted-foreground">Subscription ID</label>
                           <div className="text-xs font-mono text-muted-foreground">{subscription.subscriptionId}</div>
                         </div>
                       )}
                     </div>
                   );
                 })()}
               </div>
            </DialogContent>
          </Dialog>

          <BillingProfileModal
            user={selectedUser}
            open={billingProfileModalOpen}
            onOpenChange={setBillingProfileModalOpen}
          />
        </>
      )}

      {/* Revoke Access Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <UserX className="w-5 h-5" />
              Revoke User Access
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke access for {selectedUser?.full_name || selectedUser?.email}. 
              The user will no longer be able to access the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Revoking Access *</label>
              <Textarea
                placeholder="Explain why access is being revoked..."
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-800 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Warning</span>
              </div>
              <p className="text-red-700 text-sm mt-1">
                This action will immediately prevent the user from accessing the platform. 
                Consider deducting flexi credits first if needed.
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRevokeReason("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAccess}
              disabled={revokeLoading || !revokeReason.trim()}
              className="bg-destructive hover:bg-destructive/90"
            >
              {revokeLoading ? "Revoking..." : "Revoke Access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedUser?.full_name || selectedUser?.email} and all their associated data. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Deletion *</label>
              <Textarea
                placeholder="Explain why this user is being deleted..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-800 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Permanent Action</span>
              </div>
              <p className="text-red-700 text-sm mt-1">
                This will permanently delete the user and ALL their data including transactions, 
                bookings, and messages. This action cannot be reversed.
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteReason("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleteLoading || !deleteReason.trim()}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteLoading ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}