
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { OptimizedDashboardModals } from "@/components/dashboard/OptimizedDashboardModals";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardCampaigns } from "@/components/dashboard/DashboardCampaigns";
import { useDashboard } from "@/hooks/useDashboard";
import { useDashboardModals } from "@/hooks/useDashboardModals";
import { SuccessModal } from "@/components/SuccessModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { SubscriptionStatusCard } from "@/components/SubscriptionStatusCard";
import { DashboardSkeleton } from "@/components/PageSkeleton";
import { useUserCampaigns } from "@/hooks/useUserCampaigns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FixUpgradeButton } from "@/components/FixUpgradeButton";
import { useRoutePrefetch } from '@/hooks/useRoutePrefetch';
import { UserRecurringDeductions } from "@/components/dashboard/UserRecurringDeductions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionsTable } from "@/components/wallet/TransactionsTable";
import { TransactionSummaryCards } from "@/components/wallet/TransactionSummaryCards";
import { UpcomingChargesTable } from "@/components/wallet/UpcomingChargesTable";
import { AwardedCreditsCard } from "@/components/wallet/AwardedCreditsCard";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { useUpcomingCharges } from "@/hooks/useUpcomingCharges";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Clock, Lock } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { TopUpModal } from "@/components/TopUpModal";
import { AwardedCreditsUnlockModal } from "@/components/wallet/AwardedCreditsUnlockModal";
import { useAwardedCredits } from "@/hooks/useAwardedCredits";
import { useAwardedCreditsEligibility } from "@/hooks/useAwardedCreditsEligibility";
import { useQueryClient } from "@tanstack/react-query";

export default function UserDashboard() {
  const { user, profile, refreshProfile, refreshSubscription } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tabParam = searchParams.get('tab');
  const queryClient = useQueryClient();

  // Prefetch common routes for faster navigation
  useRoutePrefetch({
    routes: ['/marketplace', '/services', '/messages', '/settings'],
    priority: 'low',
    delay: 2000,
  });
  const isMobile = useIsMobile();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Use optimized modal management
  const { modalState, openModal, closeModal } = useDashboardModals();
  
  // Use unified dashboard hook
  const {
    userStats,
    allTransactions,
    spentTransactions,
    recentTransactions,
    refreshData,
    isLoading,
    isInitialLoading,
  } = useDashboard();
  
  const { campaigns, isLoading: campaignsLoading } = useUserCampaigns();
  const { data: transactions } = useTransactionHistory();
  const { data: upcomingCharges } = useUpcomingCharges();
  const { toast } = useToast();
  
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{ type: "payment-method" | "top-up", amount?: number }>({ type: "top-up" });
  const [activeTab, setActiveTab] = useState(tabParam || "transactions");
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [lastUpgradeAmount, setLastUpgradeAmount] = useState<number>(0);

  // Awarded credits hooks for unlock functionality
  const { data: awardedCreditsData } = useAwardedCredits();
  const lockedBalance = awardedCreditsData?.lockedBalance || 0;
  const { data: eligibilityData } = useAwardedCreditsEligibility(
    lastUpgradeAmount > 0 ? { topupAmount: lastUpgradeAmount } : undefined
  );

  // Update active tab when URL param changes
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  
  // Calculate quick stats for overview tab
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentTxns = transactions?.filter(t => 
    new Date(t.date) > last30Days
  ) || [];
  
  const totalSpent30Days = recentTxns
    .filter(t => t.type === "spent")
    .reduce((sum, t) => sum + Math.abs(t.points), 0);
    
  const totalEarned30Days = recentTxns
    .filter(t => t.type === "earned")
    .reduce((sum, t) => sum + t.points, 0);
  
  // Handle tab change with URL update
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/dashboard?tab=${tab}`, { replace: true });
  };

  // Confirm Stripe upgrade session on return from checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const upgradeSuccess = params.get("upgrade_success");
    const sessionId = params.get("session_id");
    if (upgradeSuccess && sessionId) {
      supabase.functions.invoke("confirm-upgrade-session", { body: { session_id: sessionId } })
        .then(async ({ data, error }) => {
          console.log('[UPGRADE-SUCCESS] Confirm response:', { data, error });

          if (error) {
            console.error("Upgrade confirmation failed", error);
            toast({ title: "Upgrade processing", description: "We're verifying your payment. Refresh in a moment.", variant: "default" });
          } else if (data?.success) {
            // Handle both direct and wrapped responses, with fallbacks
            const response = data.data || data;
            const credits = response.upgradeCredits || response.upgrade_credits_added || 0;
            const plan = response.planName || response.plan_name || 'your new plan';

            console.log('[UPGRADE-SUCCESS] Parsed values:', { credits, plan });

            toast({
              title: "Plan upgraded successfully!",
              description: credits > 0
                ? `+${credits} credits added for ${plan}`
                : `Successfully upgraded to ${plan}`
            });

            // Refresh data and subscription to get latest balance
            await Promise.all([
              refreshData(),
              refreshSubscription(),
              refreshProfile()
            ]);

            // Set upgrade amount to check unlock eligibility
            if (credits > 0) {
              setLastUpgradeAmount(credits);
              // Invalidate queries to get fresh eligibility data
              queryClient.invalidateQueries({ queryKey: ['awarded-credits-eligibility'] });
              queryClient.invalidateQueries({ queryKey: ['awarded-credits'] });
            }
          }
        })
        .finally(() => {
          // Clean URL and redirect to dashboard transactions tab
          navigate('/dashboard?tab=transactions', { replace: true });
        });
    }
  }, [toast, refreshData, navigate, refreshSubscription, refreshProfile, queryClient]);

  // Check unlock eligibility after upgrade payment
  useEffect(() => {
    if (lastUpgradeAmount > 0 && eligibilityData?.canUnlock && lockedBalance > 0) {
      console.log('[UNLOCK-MODAL] Showing unlock modal after upgrade', {
        lastUpgradeAmount,
        canUnlock: eligibilityData?.canUnlock,
        lockedBalance,
        maxUnlock: eligibilityData?.maxUnlock
      });
      setShowUnlockModal(true);
    }
  }, [lastUpgradeAmount, eligibilityData, lockedBalance]);

  // Memoize callback functions to prevent unnecessary re-renders
  const handleTopUpSuccess = useMemo(() => (amount?: number, showSuccessModal?: boolean) => {
    refreshData();
    if (showSuccessModal) {
      setSuccessModalData({ type: "top-up", amount });
      setSuccessModalOpen(true);
    }
  }, [refreshData]);

  // Defensive loading state: only show skeleton if truly NO data exists
  // Check multiple data sources to ensure we have SOMETHING to display
  const hasAnyData =
    allTransactions.length > 0 ||
    campaigns.length > 0 ||
    userStats.currentBalance !== 0 ||
    (transactions && transactions.length > 0);

  // Show loading skeleton only on TRUE initial load (when fetching data for the first time)
  // isInitialLoading = true ONLY when loading AND no data exists yet
  // This prevents skeleton flash on tab switches, background refetches, or polling queries
  if (!user) {
    return <DashboardSkeleton />;
  }

  // Only show skeleton if loading AND we have absolutely no data to display
  if (isInitialLoading && !hasAnyData) {
    return <DashboardSkeleton />;
  }

  // If we have ANY data, render the dashboard even if background refetch is happening

  return (
    <SidebarLayout>
      {/* Skip Navigation for Keyboard Users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>

      <div className={isMobile ? "container mx-auto px-2 py-4" : "container mx-auto px-4 py-8"}>

        <DashboardHeader isMobile={isMobile} />

        {/* Subscription Status */}
        <div className={isMobile ? "mb-6" : "mb-8"}>
          <SubscriptionStatusCard compact={isMobile} />
        </div>

        {/* Tabbed Dashboard Content */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList
            className={isMobile ? "grid w-full grid-cols-3 gap-1" : "grid w-full grid-cols-3"}
            aria-label="Dashboard sections"
          >
            <TabsTrigger value="transactions" className="flex items-center gap-1" aria-label="Overview section">
              <Wallet className="w-4 h-4" />
              <span className={isMobile ? "text-xs" : ""}>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-1" aria-label="Billing and upcoming charges section">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span className={isMobile ? "text-xs" : ""}>Billing</span>
            </TabsTrigger>
            <TabsTrigger value="awarded" className="flex items-center gap-1" aria-label="Awarded credits section">
              <Lock className="w-4 h-4" aria-hidden="true" />
              <span className={isMobile ? "text-xs" : ""}>Awarded</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab (Summary Stats + Campaigns + Transactions) */}
          <TabsContent value="transactions" className="space-y-6" id="main-content" role="region" aria-label="Dashboard overview">
            <TransactionSummaryCards transactions={transactions || []} />
            <DashboardCampaigns
              campaigns={campaigns}
              campaignsLoading={campaignsLoading}
            />
            <TransactionsTable transactions={transactions || []} />
          </TabsContent>

          {/* Billing & Charges Tab */}
          <TabsContent value="billing" className="space-y-6" role="region" aria-label="Billing and upcoming charges">
            <UpcomingChargesTable charges={upcomingCharges || []} />
            <UserRecurringDeductions />
          </TabsContent>

          {/* Awarded Credits Tab */}
          <TabsContent value="awarded" role="region" aria-label="Awarded credits">
            <AwardedCreditsCard />
          </TabsContent>
        </Tabs>
      </div>

      {/* Optimized Modals */}
      <OptimizedDashboardModals
        modalState={modalState}
        closeModal={closeModal}
        openModal={openModal}
        allTransactions={allTransactions}
        spentTransactions={spentTransactions}
        userStats={userStats}
        onTopUpSuccess={handleTopUpSuccess}
      />
      
      <SuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        type={successModalData.type}
        amount={successModalData.amount}
      />
      
      <TopUpModal
        isOpen={topUpModalOpen}
        onClose={() => setTopUpModalOpen(false)}
        onSuccess={handleTopUpSuccess}
      />

      {/* Unlock Awarded Credits Modal - Shows after upgrade payment */}
      {eligibilityData && (
        <AwardedCreditsUnlockModal
          open={showUnlockModal}
          onOpenChange={setShowUnlockModal}
          topupTransactionId=""
          topupAmount={lastUpgradeAmount}
          lockedBalance={lockedBalance}
          maxUnlock={eligibilityData.maxUnlock || 0}
          expiringCredits={eligibilityData.expiringCredits || []}
          currentBalance={profile?.flexi_credits_balance || 0}
        />
      )}
    </SidebarLayout>
  );
}
