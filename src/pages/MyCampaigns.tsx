import React, { useState, lazy, Suspense, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveContainer } from '@/components/ui/mobile-responsive';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Target, BarChart3, Wallet } from '@/lib/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TopUpModal } from '@/components/TopUpModal';
import { AdminInterface } from '@/components/campaigns/AdminInterface';
import { useToast } from '@/hooks/use-toast';
import { useCampaignTargets } from '@/hooks/useCampaignTargets';
import { supabase } from '@/integrations/supabase/client';
import { SidebarLayout } from '@/components/layout/SidebarLayout';

// Lazy load heavy components for optimal performance
const ActiveCampaigns = lazy(() => import('@/components/campaigns/ActiveCampaigns').then(m => ({ default: m.ActiveCampaigns })));
const SuperAdminInterface = lazy(() => import('@/components/campaigns/SuperAdminInterface').then(m => ({ default: m.SuperAdminInterface })));

const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map(i => (
      <Card key={i}>
        <CardContent className="p-3 sm:p-6">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const MyCampaigns = React.memo(() => {
  const isMobile = useIsMobile();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [hideInactiveCampaigns, setHideInactiveCampaigns] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { campaignTargets, setCampaignTargets, refreshTargets } = useCampaignTargets();
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [userCampaigns, setUserCampaigns] = useState([]);
  const [adminMode, setAdminMode] = useState(false);
  const [editingTarget, setEditingTarget] = useState<any>(null);
  const [showTargetDialog, setShowTargetDialog] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    checkAdminStatus();
    fetchUserCampaigns();
    handleURLParameters();
  }, [user, profile]);

  // Handle URL parameters for checkout success
  const handleURLParameters = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const topupStatus = urlParams.get('topup');
    const points = urlParams.get('points');
    if (topupStatus === 'success' && points) {
      toast({
        title: "Payment Successful!",
        description: `${points} points have been added to your account.`
      });

      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      // Refresh profile to show updated points immediately
      refreshProfile();
    }

    const vaStatus = urlParams.get('va_subscribe');
    if (vaStatus === 'success') {
      toast({
        title: "Subscribed successfully",
        description: "Your VA Support subscription is now active in Stripe."
      });
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } else if (vaStatus === 'canceled') {
      toast({
        title: "Checkout canceled",
        description: "You canceled the VA Support subscription checkout.",
        variant: "destructive"
      });
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  };

  const fetchUserCampaigns = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('campaign_participants').select(`
          *,
          lead_gen_campaigns (
            id,
            name,
            description,
            status,
            start_date,
            end_date,
            total_budget
          )
        `).eq('user_id', user.id).order('joined_at', { ascending: false });
      if (error) throw error;
      setUserCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching user campaigns:', error);
    }
  };

  const checkAdminStatus = async () => {
    if (!user) return;

    // First try to use the profile from context
    if (profile) {
      if (profile.role === 'admin') {
        setIsAdmin(true);
        return;
      }
    }

    // Fallback to API call if profile not available
    try {
      const { data, error } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
      if (data && data.role === 'admin') {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const handleTopUpSuccess = (points: number) => {
    refreshProfile();
    toast({
      title: "Top-up Successful! 🎉",
      description: `${points} points added to your account.`
    });
  };

  const handleStopCampaign = async (participantId: string) => {
    try {
      const { error } = await supabase.from('campaign_participants').update({
        billing_status: 'stopped',
        updated_at: new Date().toISOString()
      }).eq('id', participantId).eq('user_id', user?.id);
      if (error) throw error;
      toast({
        title: "Billing Paused",
        description: "Monthly billing has been paused. Your campaign will continue running and you won't be charged next cycle."
      });
      fetchUserCampaigns();
    } catch (error) {
      console.error('Error pausing billing:', error);
      toast({
        title: "Error",
        description: "Failed to pause billing. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReactivateCampaign = async (participantId: string) => {
    try {
      const { error } = await supabase.from('campaign_participants').update({
        billing_status: 'active',
        updated_at: new Date().toISOString()
      }).eq('id', participantId).eq('user_id', user?.id);
      if (error) throw error;
      toast({
        title: "Billing Resumed",
        description: "Monthly billing has been resumed. You'll be charged starting next cycle."
      });
      fetchUserCampaigns();
    } catch (error) {
      console.error('Error resuming billing:', error);
      toast({
        title: "Error",
        description: "Failed to resume billing. Please try again.",
        variant: "destructive"
      });
    }
  };

  const hasCampaigns = userCampaigns && userCampaigns.length > 0;

  return (
    <SidebarLayout title="My Campaigns" description="Manage your active lead generation campaigns">
      <ResponsiveContainer>
        <div className={isMobile ? "pt-2" : "pt-4"}>
          {/* Hero Section - Accessibility Enhanced */}
          <header
            className={`${isMobile ? "mb-8" : "mb-12"} text-center`}
            role="banner"
            aria-labelledby="my-campaigns-heading"
          >
            <Badge
              variant="secondary"
              className="inline-flex items-center gap-2 mb-3 px-4 py-2"
            >
              <Target className="h-4 w-4" aria-hidden="true" />
              <span>My Campaigns</span>
            </Badge>
            <h1
              id="my-campaigns-heading"
              className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold mb-3 text-primary`}
            >
              My Active Campaigns
            </h1>
            <p className={`${isMobile ? "text-sm" : "text-base"} text-muted-foreground max-w-2xl mx-auto`}>
              Manage and monitor your active lead generation campaigns
            </p>
          </header>

          {/* Launch Button */}
          <div className="flex justify-center mb-8 px-4 sm:px-0">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/campaigns/launch">
                <Plus className="mr-2 h-4 w-4" />
                Launch New Campaign
              </Link>
            </Button>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            {!hasCampaigns ? (
              // No campaigns - prompt to launch
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Target className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold mb-2">No Campaigns Yet</h2>
                    <p className="text-muted-foreground mb-6">
                      Launch your first lead generation campaign to start attracting customers
                    </p>
                  </div>
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link to="/campaigns/launch">
                      <Plus className="mr-2 h-4 w-4" />
                      Launch Your First Campaign
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              // Show campaigns
              <div>
               

                <Suspense fallback={<LoadingSkeleton />}>
                  <ActiveCampaigns 
                    hideInactiveCampaigns={hideInactiveCampaigns}
                    setHideInactiveCampaigns={setHideInactiveCampaigns}
                  />
                </Suspense>
              </div>
            )}

            {/* Admin Tools */}
            {isAdmin && (
              <div className="mt-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary rounded-lg shadow-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold">Admin Tools</h2>
                </div>

                <div className="grid gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm sm:text-base">Campaign Management</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Manage campaign targets and templates</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setAdminMode(!adminMode)}
                      className="w-full sm:w-auto"
                    >
                      {adminMode ? 'Hide' : 'Show'} Admin Panel
                    </Button>
                  </div>
                  
                  {adminMode && (
                    <Card>
                      <CardContent className="p-6">
                        <AdminInterface 
                          campaignTargets={campaignTargets}
                          setCampaignTargets={setCampaignTargets}
                          refreshTargets={refreshTargets}
                          editingTarget={editingTarget}
                          setEditingTarget={setEditingTarget}
                          showTargetDialog={showTargetDialog}
                          setShowTargetDialog={setShowTargetDialog}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Suspense fallback={<LoadingSkeleton />}>
                  <SuperAdminInterface />
                </Suspense>
              </div>
            )}
          </div>
        </div>
      </ResponsiveContainer>

      {/* Top Up Modal */}
      <TopUpModal 
        isOpen={topUpModalOpen}
        onClose={() => setTopUpModalOpen(false)}
        onSuccess={handleTopUpSuccess}
      />
    </SidebarLayout>
  );
});

MyCampaigns.displayName = 'MyCampaigns';

export default MyCampaigns;