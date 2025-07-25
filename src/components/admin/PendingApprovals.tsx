import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, X, Clock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PendingUser {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  approval_status: string;
}

const PendingApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
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

  const handleApproval = async (userId: string, status: 'approved' | 'rejected') => {
    setActionLoading(userId);
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { 
          action: 'approve_user',
          userId,
          status
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: data.message,
      });

      // Refresh the pending users list
      fetchPendingUsers();
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
                    onClick={() => handleApproval(user.user_id, 'approved')}
                    disabled={actionLoading === user.user_id}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    {actionLoading === user.user_id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Approve
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
    </Card>
  );
};

export default PendingApprovals;