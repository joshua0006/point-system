import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCampaignInvitations } from '@/hooks/useCampaignInvitations';
import { CampaignInvitationForm } from './CampaignInvitationForm';
import { Trash2, RefreshCw, ExternalLink, Copy, Calendar, DollarSign, Users } from 'lucide-react';
import { toast } from 'sonner';

export function CampaignInvitationManagement() {
  const { 
    invitations, 
    loading, 
    fetchInvitations, 
    deleteInvitation, 
    resendInvitation 
  } = useCampaignInvitations();

  const copyInvitationLink = (token: string) => {
    const baseUrl = window.location.origin;
    const previewLink = `${baseUrl}/campaign-preview/${token}`;
    navigator.clipboard.writeText(previewLink);
    toast.success('Campaign summary link copied to clipboard!');
  };

  const openInvitationLink = (token: string) => {
    const baseUrl = window.location.origin;
    const previewLink = `${baseUrl}/campaign-preview/${token}`;
    window.open(previewLink, '_blank');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'accepted':
        return 'secondary';
      case 'declined':
        return 'destructive';
      case 'expired':
        return 'outline';
      default:
        return 'default';
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Create New Invitation */}
      <Card>
        <CardHeader>
          <CardTitle>Create Campaign Proposal</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create personalized campaign proposals with pre-configured templates and send summary links to clients
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <CampaignInvitationForm onInvitationCreated={fetchInvitations} />
          </div>
        </CardContent>
      </Card>

      {/* Existing Invitations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Campaign Proposals</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage and track all campaign proposals and their approval status
              </p>
            </div>
            <Button 
              onClick={fetchInvitations} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading invitations...</p>
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No campaign proposals found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Target User</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation: any) => (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invitation.campaign_config.templateName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-muted-foreground">
                              {invitation.template?.name}
                            </p>
                            {invitation.is_public && (
                              <Badge variant="outline" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                Public
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {invitation.is_public ? 'Open to All Consultants' : invitation.target_profile?.full_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {invitation.is_public ? 'Any qualified consultant' : invitation.target_profile?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{invitation.budget_amount} pts</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(
                          isExpired(invitation.expires_at) && invitation.status === 'pending' 
                            ? 'expired' 
                            : invitation.status
                        )}>
                          {isExpired(invitation.expires_at) && invitation.status === 'pending' 
                            ? 'expired' 
                            : invitation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span className={isExpired(invitation.expires_at) ? 'text-red-500' : ''}>
                            {new Date(invitation.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(invitation.created_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => copyInvitationLink(invitation.invitation_token)}
                            variant="ghost"
                            size="sm"
                            title={invitation.is_public ? "Copy public proposal link" : "Copy campaign summary link"}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => openInvitationLink(invitation.invitation_token)}
                            variant="ghost"
                            size="sm"
                            title="Open campaign summary"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          {invitation.status === 'pending' && isExpired(invitation.expires_at) && (
                            <Button
                              onClick={() => resendInvitation(invitation.id)}
                              variant="ghost"
                              size="sm"
                              title="Extend proposal"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            onClick={() => deleteInvitation(invitation.id)}
                            variant="ghost"
                            size="sm"
                            title="Delete proposal"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
