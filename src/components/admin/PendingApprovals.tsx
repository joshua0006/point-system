import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, Check, X, Clock, User, UserCheck } from '@/lib/icons';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PendingUser {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  approval_status: string;
  role: 'user' | 'consultant' | 'admin';
}

const PendingApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('user');
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchPendingUsers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'list_pending_users' }
      });

      if (error) throw error;
      setPendingUsers(data.users || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch pending users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (userId: string, status: 'approved' | 'rejected', role?: string) => {
    setActionLoading(userId);
    try {
      // First approve/reject the user
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { 
          action: 'approve_user',
          userId,
          status
        }
      });

      if (error) throw error;

      // If approving and a role was selected, update the role
      if (status === 'approved' && role && role !== 'user') {
        const { error: roleError } = await supabase
          .from('profiles')
          .update({ role: role as 'user' | 'consultant' | 'admin' })
          .eq('user_id', userId);

        if (roleError) {
          console.error('Role update error:', roleError);
          toast({
            title: "Warning",
            description: "User approved but role assignment failed. Please update role manually.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Success",
        description: `User ${status} successfully${role && status === 'approved' ? ` with role: ${role}` : ''}`,
      });

      // Refresh the pending users list
      fetchPendingUsers();
      setApprovalModalOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${status} user`,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openApprovalModal = (user: PendingUser) => {
    setSelectedUser(user);
    setSelectedRole('user');
    setApprovalModalOpen(true);
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending User Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          Pending User Approvals
          <Badge variant="secondary" className="ml-2">
            {pendingUsers.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pending user approvals</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-muted/20"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {user.full_name || 'No name provided'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Registered: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openApprovalModal(user)}
                    disabled={actionLoading === user.user_id}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    {actionLoading === user.user_id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-1" />
                        Review
                      </>
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApproval(user.user_id, 'rejected')}
                    disabled={actionLoading === user.user_id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {actionLoading === user.user_id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchPendingUsers}
            disabled={loading}
          >
            Refresh List
          </Button>
        </div>
      </CardContent>

      {/* Approval Modal */}
      <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve User Account</DialogTitle>
            <DialogDescription>
              Review and approve {selectedUser?.full_name || selectedUser?.email}'s account application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p><strong>Name:</strong> {selectedUser?.full_name || 'Not provided'}</p>
              <p><strong>Email:</strong> {selectedUser?.email}</p>
              <p><strong>Registration Date:</strong> {selectedUser ? new Date(selectedUser.created_at).toLocaleDateString() : ''}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="consultant">Consultant</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose the role for this user. This can be changed later.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => selectedUser && handleApproval(selectedUser.user_id, 'approved', selectedRole)}
                disabled={!selectedUser || actionLoading === selectedUser?.user_id}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve & Assign Role
              </Button>
              <Button 
                variant="outline"
                onClick={() => setApprovalModalOpen(false)}
                disabled={actionLoading === selectedUser?.user_id}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PendingApprovals;