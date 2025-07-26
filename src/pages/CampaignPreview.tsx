import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Target, Users, Calendar, DollarSign, CheckCircle, XCircle, Clock, ArrowLeft, Rocket, TrendingUp, BarChart3, Zap, Star } from 'lucide-react';

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

      toast.success('Campaign launched successfully!');
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

      toast.success('Campaign proposal declined');
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
          <div className="flex items-center justify-center gap-2 mb-4">
            <Rocket className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Campaign Proposal
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A personalized lead generation campaign designed specifically for your business needs
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
              Please sign in to review and launch this campaign proposal.
            </AlertDescription>
          </Alert>
        )}

        {hasInsufficientBalance && canAccept && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <DollarSign className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              Insufficient points balance to launch this campaign. You need {invitation.budget_amount} points but only have {userBalance} points.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Main Campaign Overview */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Target className="h-6 w-6 text-primary" />
                  Campaign Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-bold text-2xl mb-2">{invitation.campaign_config.templateName}</h3>
                  <p className="text-muted-foreground text-lg">{invitation.campaign_config.description}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white/50 p-4 rounded-lg border">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Target Audience
                    </Label>
                    <p className="font-semibold mt-1">{invitation.campaign_config.targetAudience}</p>
                  </div>
                  <div className="bg-white/50 p-4 rounded-lg border">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Campaign Angle
                    </Label>
                    <p className="font-semibold mt-1">{invitation.campaign_config.campaignAngle}</p>
                  </div>
                </div>

                {invitation.campaign_config.customMessage && (
                  <div className="bg-white/70 p-4 rounded-lg border border-dashed border-primary/30">
                    <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      Personal Message from {adminProfile?.full_name}
                    </Label>
                    <p className="text-sm italic">{invitation.campaign_config.customMessage}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expected Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Expected Campaign Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">15-25</p>
                    <p className="text-sm text-muted-foreground">Qualified Leads</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">30-45%</p>
                    <p className="text-sm text-muted-foreground">Response Rate</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-600">7-14</p>
                    <p className="text-sm text-muted-foreground">Days Duration</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Details Sidebar */}
          <div className="space-y-6">
            {/* Investment & ROI */}
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <DollarSign className="h-5 w-5" />
                  Investment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">
                    {invitation.budget_amount}
                  </div>
                  <p className="text-sm text-muted-foreground">Points Required</p>
                </div>
                
                {isAuthenticated && (
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium">Your Current Balance</Label>
                    <p className="text-lg font-semibold">{userBalance} points</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all" 
                        style={{width: `${Math.min((userBalance / invitation.budget_amount) * 100, 100)}%`}}
                      ></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Proposal Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Proposal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Proposed by</Label>
                  <p className="text-sm font-semibold">{adminProfile?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{adminProfile?.email}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Campaign Status</Label>
                  <Badge 
                    variant={invitation.status === 'pending' ? 'default' : 
                            invitation.status === 'accepted' ? 'secondary' : 'destructive'}
                    className="ml-2"
                  >
                    {invitation.status === 'pending' ? 'Awaiting Launch' : 
                     invitation.status === 'accepted' ? 'Launched' : 'Declined'}
                  </Badge>
                </div>

                <div>
                  <Label className="text-sm font-medium">Proposal Expires</Label>
                  <p className="text-sm">{new Date(invitation.expires_at).toLocaleDateString()}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm">{new Date(invitation.created_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        {canAccept && (
          <div className="text-center space-y-4">
            <div className="flex gap-4 justify-center">
              <Button
                onClick={handleAccept}
                disabled={processing || hasInsufficientBalance}
                size="lg"
                className="min-w-40 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              >
                {processing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Launch Campaign
                  </>
                )}
              </Button>
              <Button
                onClick={handleDecline}
                disabled={processing}
                variant="outline"
                size="lg"
                className="min-w-32"
              >
                {processing ? 'Processing...' : 'Decline Proposal'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              By launching this campaign, {invitation.budget_amount} points will be deducted from your balance
            </p>
          </div>
        )}

        {!isAuthenticated && (
          <div className="text-center">
            <Button onClick={() => navigate('/auth')} size="lg" className="min-w-40">
              <Users className="h-4 w-4 mr-2" />
              Sign In to Review Proposal
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