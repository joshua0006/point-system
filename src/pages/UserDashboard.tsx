
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { OptimizedDashboardModals } from "@/components/dashboard/OptimizedDashboardModals";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStatsCards } from "@/components/dashboard/DashboardStatsCards";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useDashboardModals } from "@/hooks/useDashboardModals";
import { SuccessModal } from "@/components/SuccessModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { SubscriptionStatusCard } from "@/components/SubscriptionStatusCard";
import { DashboardSkeleton } from "@/components/PageSkeleton";
import { useUserCampaigns } from "@/hooks/useUserCampaigns";

export default function UserDashboard() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Use optimized modal management
  const { modalState, openModal, closeModal } = useDashboardModals();
  
  // Use optimized dashboard data hook
  const {
    userStats,
    allTransactions,
    spentTransactions,
    recentTransactions,
    refreshData,
    isLoading,
  } = useDashboardData();
  
  const { campaigns, isLoading: campaignsLoading } = useUserCampaigns();
  
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{ type: "payment-method" | "top-up", amount?: number }>({ type: "top-up" });

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
          openModal={openModal}
        />

        {/* Dashboard Content */}
        <DashboardContent 
          isMobile={isMobile}
          recentTransactions={recentTransactions}
          campaigns={campaigns}
          campaignsLoading={campaignsLoading}
          openModal={openModal}
        />
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
