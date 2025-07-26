import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Target, Users, Calendar, DollarSign, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';

interface CampaignInvitation {
  id: string;
  admin_id: string;
  target_user_id: string;
  template_id: string;
  campaign_config: any;
  budget_amount: number;
  invitation_token: string;
  status: string;
  expires_at: string;
  created_at: string;
  accepted_at?: string;
}

interface AdminProfile {
  full_name: string;
  email: string;
}

export default function CampaignPreview() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<CampaignInvitation | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchInvitation();
      checkAuth();
    }
  }, [token]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
    setCurrentUserId(user?.id || null);
    
    if (user) {
      // Fetch user's points balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('points_balance')
        .eq('user_id', user.id)
        .single();
      
      if (profile) {
        setUserBalance(profile.points_balance);
      }
    }
  };

  const fetchInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_invitations')
        .select('*')
        .eq('invitation_token', token)
        .single();

      if (error) throw error;

      setInvitation(data);

      // Fetch admin profile
      const { data: adminData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', data.admin_id)
        .single();

      if (adminData) {
        setAdminProfile(adminData);
      }

    } catch (error) {
      console.error('Error fetching invitation:', error);
      toast.error('Campaign invitation not found or has expired');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!invitation || !isAuthenticated || !currentUserId) {
      toast.error('Please sign in to accept this invitation');
      return;
    }

    if (currentUserId !== invitation.target_user_id) {
      toast.error('This invitation is not for your account');
      return;
    }

    if (userBalance < invitation.budget_amount) {
      toast.error('Insufficient points balance to accept this campaign');
      return;
    }

    setProcessing(true);
    try {
      // Start transaction by creating the campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('lead_gen_campaigns')
        .insert({
          name: invitation.campaign_config.templateName,
          description: invitation.campaign_config.description,
          total_budget: invitation.budget_amount,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          created_by: invitation.admin_id,
          status: 'active'
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Create campaign participation
      const { error: participationError } = await supabase
        .from('campaign_participants')
        .insert({
          campaign_id: campaign.id,
          user_id: currentUserId,
          budget_contribution: invitation.budget_amount,
          consultant_name: 'Campaign Participant',
          billing_status: 'active',
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });

      if (participationError) throw participationError;

      // Deduct points from user
      const { error: balanceError } = await supabase.rpc('increment_points_balance', {
        user_id: currentUserId,
        points_to_add: -invitation.budget_amount
      });

      if (balanceError) throw balanceError;

      // Create points transaction record
      const { error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          user_id: currentUserId,
          type: 'purchase',
          amount: -invitation.budget_amount,
          description: `Campaign participation: ${invitation.campaign_config.templateName}`
        });

      if (transactionError) throw transactionError;

      // Update invitation status
      const { error: updateError } = await supabase
        .from('campaign_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          campaign_id: campaign.id
        })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      toast.success('Campaign accepted successfully!');
      navigate('/lead-gen-campaigns');

    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept campaign invitation');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation || !isAuthenticated || !currentUserId) {
      toast.error('Please sign in to decline this invitation');
      return;
    }

    if (currentUserId !== invitation.target_user_id) {
      toast.error('This invitation is not for your account');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('campaign_invitations')
        .update({
          status: 'declined'
        })
        .eq('id', invitation.id);

      if (error) throw error;

      toast.success('Campaign invitation declined');
      navigate('/');

    } catch (error) {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading campaign invitation...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invitation Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This campaign invitation may have expired or been removed.
            </p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = new Date(invitation.expires_at) < new Date();
  const isAlreadyProcessed = invitation.status !== 'pending';
  const canAccept = isAuthenticated && currentUserId === invitation.target_user_id && !isExpired && !isAlreadyProcessed;
  const hasInsufficientBalance = userBalance < invitation.budget_amount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Campaign Invitation</h1>
          <p className="text-muted-foreground">
            You've been invited to participate in a lead generation campaign
          </p>
        </div>

        {/* Status Alerts */}
        {isExpired && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              This invitation has expired and is no longer valid.
            </AlertDescription>
          </Alert>
        )}

        {isAlreadyProcessed && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <CheckCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              This invitation has already been {invitation.status}.
            </AlertDescription>
          </Alert>
        )}

        {!isAuthenticated && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Users className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              Please sign in to accept or decline this invitation.
            </AlertDescription>
          </Alert>
        )}

        {hasInsufficientBalance && canAccept && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <DollarSign className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              Insufficient points balance. You need {invitation.budget_amount} points but only have {userBalance} points.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Campaign Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Campaign Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{invitation.campaign_config.templateName}</h3>
                <p className="text-muted-foreground">{invitation.campaign_config.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Target Audience</Label>
                  <p className="text-sm">{invitation.campaign_config.targetAudience}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Campaign Angle</Label>
                  <p className="text-sm">{invitation.campaign_config.campaignAngle}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Budget Contribution</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-lg font-semibold">
                    {invitation.budget_amount} points
                  </Badge>
                </div>
              </div>

              {invitation.campaign_config.customMessage && (
                <div>
                  <Label className="text-sm font-medium">Personal Message</Label>
                  <p className="text-sm bg-muted p-3 rounded-lg mt-1">
                    {invitation.campaign_config.customMessage}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invitation Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Invitation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Invited by</Label>
                <p className="text-sm">{adminProfile?.full_name} ({adminProfile?.email})</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Badge 
                  variant={invitation.status === 'pending' ? 'default' : 
                          invitation.status === 'accepted' ? 'secondary' : 'destructive'}
                >
                  {invitation.status}
                </Badge>
              </div>

              <div>
                <Label className="text-sm font-medium">Expires</Label>
                <p className="text-sm">{new Date(invitation.expires_at).toLocaleDateString()}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm">{new Date(invitation.created_at).toLocaleDateString()}</p>
              </div>

              {isAuthenticated && (
                <div>
                  <Label className="text-sm font-medium">Your Balance</Label>
                  <p className="text-sm font-semibold">{userBalance} points</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        {canAccept && (
          <div className="flex gap-4 justify-center">
            <Button
              onClick={handleAccept}
              disabled={processing || hasInsufficientBalance}
              size="lg"
              className="min-w-32"
            >
              {processing ? 'Processing...' : 'Accept Campaign'}
            </Button>
            <Button
              onClick={handleDecline}
              disabled={processing}
              variant="outline"
              size="lg"
              className="min-w-32"
            >
              {processing ? 'Processing...' : 'Decline'}
            </Button>
          </div>
        )}

        {!isAuthenticated && (
          <div className="text-center">
            <Button onClick={() => navigate('/auth')} size="lg">
              Sign In to Respond
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`text-sm font-medium ${className}`} {...props}>
      {children}
    </label>
  );
}