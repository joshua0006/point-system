
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { OptimizedDashboardModals } from "@/components/dashboard/OptimizedDashboardModals";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStatsCards } from "@/components/dashboard/DashboardStatsCards";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
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
import { UpcomingChargesTable } from "@/components/wallet/UpcomingChargesTable";
import { AwardedCreditsCard } from "@/components/wallet/AwardedCreditsCard";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { useUpcomingCharges } from "@/hooks/useUpcomingCharges";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, History, Clock, Settings, Lock } from "lucide-react";
import { useSearchParams } from "react-router-dom";

export default function UserDashboard() {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  // Prefetch common routes for faster navigation
  useRoutePrefetch({
    routes: ['/marketplace', '/services', '/messages', '/settings'],
    priority: 'low',
    delay: 2000,
  });
  const isMobile = useIsMobile();
  
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
  } = useDashboard();
  
  const { campaigns, isLoading: campaignsLoading } = useUserCampaigns();
  const { data: transactions } = useTransactionHistory();
  const { data: upcomingCharges } = useUpcomingCharges();
  const { toast } = useToast();
  
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{ type: "payment-method" | "top-up", amount?: number }>({ type: "top-up" });
  const [activeTab, setActiveTab] = useState(tabParam || "overview");
  
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

  // Confirm Stripe upgrade session on return from checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const upgradeSuccess = params.get("upgrade_success");
    const sessionId = params.get("session_id");
    if (upgradeSuccess && sessionId) {
      supabase.functions.invoke("confirm-upgrade-session", { body: { session_id: sessionId } })
        .then(({ data, error }) => {
          if (error) {
            console.error("Upgrade confirmation failed", error);
            toast({ title: "Upgrade processing", description: "We're verifying your payment. Refresh in a moment.", variant: "default" });
          } else if (data?.success) {
            toast({ title: "Plan upgraded", description: `+${data.upgradeCredits} credits added for ${data.planName}` });
            refreshData();
          }
        })
        .finally(() => {
          // Clean URL
          const url = new URL(window.location.href);
          url.searchParams.delete("upgrade_success");
          url.searchParams.delete("session_id");
          window.history.replaceState({}, "", url.toString());
        });
    }
  }, [toast, refreshData]);

  // Memoize callback functions to prevent unnecessary re-renders
  const handleTopUpSuccess = useMemo(() => (amount?: number, showSuccessModal?: boolean) => {
    refreshData();
    if (showSuccessModal) {
      setSuccessModalData({ type: "top-up", amount });
      setSuccessModalOpen(true);
    }
  }, [refreshData]);

  // Show loading skeleton while data is being fetched
  if (isLoading || !user) {
    return <DashboardSkeleton />;
  }

  return (
    <SidebarLayout>
      <div className={isMobile ? "container mx-auto px-2 py-4" : "container mx-auto px-4 py-8"}>
        
        <DashboardHeader isMobile={isMobile} />

        {/* Subscription Status */}
        <div className={isMobile ? "mb-6" : "mb-8"}>
          <SubscriptionStatusCard compact={isMobile} />
        </div>

        {/* Stats Cards */}
        <DashboardStatsCards 
          isMobile={isMobile} 
          userStats={userStats} 
          onTabChange={setActiveTab}
        />

        {/* Tabbed Dashboard Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={isMobile ? "grid w-full grid-cols-5 gap-1" : "grid w-full grid-cols-5"}>
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <Wallet className="w-4 h-4" />
              <span className={isMobile ? "text-xs" : ""}>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-1">
              <History className="w-4 h-4" />
              <span className={isMobile ? "text-xs" : ""}>History</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className={isMobile ? "text-xs" : ""}>Billing</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-1">
              <Settings className="w-4 h-4" />
              <span className={isMobile ? "text-xs" : ""}>Plan</span>
            </TabsTrigger>
            <TabsTrigger value="awarded" className="flex items-center gap-1">
              <Lock className="w-4 h-4" />
              <span className={isMobile ? "text-xs" : ""}>Awarded</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Last 30 Days</p>
                      <p className="text-2xl font-bold text-destructive">
                        -{totalSpent30Days.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Credits spent</p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-destructive" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Last 30 Days</p>
                      <p className="text-2xl font-bold text-success">
                        +{totalEarned30Days.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Credits earned</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-success" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Dashboard Content */}
            <DashboardContent 
              isMobile={isMobile}
              recentTransactions={recentTransactions}
              campaigns={campaigns}
              campaignsLoading={campaignsLoading}
              openModal={openModal}
            />
          </TabsContent>
          
          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <TransactionsTable transactions={transactions || []} />
          </TabsContent>
          
          {/* Billing & Charges Tab */}
          <TabsContent value="billing" className="space-y-6">
            <UpcomingChargesTable charges={upcomingCharges || []} />
            <UserRecurringDeductions />
          </TabsContent>
          
          {/* Subscription Tab */}
          <TabsContent value="subscription">
            <SubscriptionStatusCard showActions={true} />
          </TabsContent>
          
          {/* Awarded Credits Tab */}
          <TabsContent value="awarded">
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
    </SidebarLayout>
  );
}
