import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, X, ExternalLink, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface ReimbursementRequest {
  id: string;
  user_id: string;
  merchant: string;
  amount: number;
  description: string | null;
  receipt_urls: string[];
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

export function AdminReimbursements() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ReimbursementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ReimbursementRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('reimbursement_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user profiles separately
      const userIds = [...new Set(data?.map(r => r.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      // Merge profiles with requests
      const requestsWithProfiles = (data || []).map(request => ({
        ...request,
        profiles: profilesData?.find(p => p.user_id === request.user_id) || { full_name: 'Unknown', email: '' }
      }));

      setRequests(requestsWithProfiles as ReimbursementRequest[]);
    } catch (error: any) {
      console.error('Error fetching reimbursement requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reimbursement requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (request: ReimbursementRequest) => {
    setActionLoading(true);
    try {
      const { error } = await supabase.functions.invoke('approve-reimbursement', {
        body: { 
          requestId: request.id,
          action: 'approve'
        }
      });

      if (error) throw error;

      toast({
        title: 'Approved',
        description: `Reimbursement request for ${request.merchant} has been approved`,
      });

      await fetchRequests();
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve reimbursement request',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!rejectionReason.trim()) {
      toast({
        title: 'Rejection reason required',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase.functions.invoke('approve-reimbursement', {
        body: { 
          requestId: selectedRequest.id,
          action: 'reject',
          rejectionReason: rejectionReason.trim()
        }
      });

      if (error) throw error;

      toast({
        title: 'Rejected',
        description: `Reimbursement request for ${selectedRequest.merchant} has been rejected`,
      });

      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectionReason('');
      await fetchRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject reimbursement request',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading reimbursement requests...</div>;
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Reimbursement Requests</h2>
        
        {requests.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No reimbursement requests found
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Receipts</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.profiles?.full_name || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground">{request.profiles?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{request.merchant}</TableCell>
                  <TableCell className="font-medium">${request.amount.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(request.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {request.receipt_urls.map((url, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(url, '_blank')}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          {index + 1}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request)}
                          disabled={actionLoading}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRejectDialog(true);
                          }}
                          disabled={actionLoading}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                    {request.status === 'rejected' && request.rejection_reason && (
                      <p className="text-sm text-muted-foreground">
                        Reason: {request.rejection_reason}
                      </p>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Reimbursement Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this request is being rejected..."
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={actionLoading}
                className="flex-1"
              >
                {actionLoading ? 'Rejecting...' : 'Reject Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
