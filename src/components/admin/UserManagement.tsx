import { useState, useEffect } from "react";
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
import { Users, Plus, Coins, RefreshCw, UserX, Minus, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: 'user' | 'consultant' | 'admin';
  points_balance: number;
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
  const [points, setPoints] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTopUp = async () => {
    const pointsAmount = parseFloat(points);
    if (!pointsAmount || pointsAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid number of points to add.",
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
          points: pointsAmount
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added ${pointsAmount} points to ${user.full_name || user.email}'s account.`,
      });

      setPoints("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Top-up error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add points. Please try again.",
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
          <DialogTitle>Top Up Points</DialogTitle>
          <DialogDescription>
            Add points to {user.full_name || user.email}'s account
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Balance</label>
            <div className="text-2xl font-bold text-accent">{user.points_balance} points</div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Points to Add</label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              min="0.1"
              step="0.1"
            />
          </div>
          <Button 
            onClick={handleTopUp} 
            disabled={loading || !points}
            className="w-full"
          >
            {loading ? "Adding..." : `Add ${points || 0} Points`}
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
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDeduct = async () => {
    const pointsAmount = parseFloat(points);
    if (!pointsAmount || pointsAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid number of points to deduct.",
        variant: "destructive",
      });
      return;
    }

    if (pointsAmount > user.points_balance) {
      toast({
        title: "Insufficient Balance",
        description: `User only has ${user.points_balance} points available.`,
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for deducting points.",
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
          points: pointsAmount,
          reason: reason.trim()
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Deducted ${pointsAmount} points from ${user.full_name || user.email}'s account.`,
      });

      setPoints("");
      setReason("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Deduct error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to deduct points. Please try again.",
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
            Deduct Points
          </DialogTitle>
          <DialogDescription>
            Remove points from {user.full_name || user.email}'s account
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Balance</label>
            <div className="text-2xl font-bold text-accent">{user.points_balance} points</div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Points to Deduct</label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              min="0.1"
              max={user.points_balance}
              step="0.1"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for Deduction *</label>
            <Textarea
              placeholder="Explain why points are being deducted..."
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
              This action cannot be undone. Points will be permanently removed from the user's account.
            </p>
          </div>
          <Button 
            onClick={handleDeduct} 
            disabled={loading || !points || !reason.trim()}
            variant="destructive"
            className="w-full"
          >
            {loading ? "Deducting..." : `Deduct ${points || 0} Points`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UserManagement() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [deductModalOpen, setDeductModalOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeLoading, setRevokeLoading] = useState(false);
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
    if (profile?.role === 'admin') {
      fetchUsers();
    }
  }, [profile]);

  if (profile?.role !== 'admin') {
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
  const totalPoints = users.reduce((sum, user) => sum + user.points_balance, 0);
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

  const handleRevokeClick = (user: UserProfile) => {
    setSelectedUser(user);
    setRevokeDialogOpen(true);
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
              Total Points
              <Coins className="w-4 h-4 text-accent" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{totalPoints.toLocaleString()}</div>
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
                  <TableHead>Points Balance</TableHead>
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
                        user.role === 'admin' ? 'destructive' :
                        user.role === 'consultant' ? 'default' : 'secondary'
                      }>
                        {user.role}
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
                        {user.points_balance.toLocaleString()} points
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
                          disabled={user.points_balance === 0}
                        >
                          <Minus className="w-4 h-4 mr-1" />
                          Deduct
                        </Button>
                        {user.approval_status === 'approved' && user.role !== 'admin' && (
                          <Button
                            onClick={() => handleRevokeClick(user)}
                            size="sm"
                            variant="destructive"
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Revoke
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
                Consider deducting points first if needed.
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
    </div>
  );
}