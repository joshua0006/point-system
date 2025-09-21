import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionOperations, type SubscriptionPlan } from "@/hooks/useSubscriptionOperations";
import { UpgradeConfirmationModal } from "@/components/UpgradeConfirmationModal";
import { SubscriptionHeader } from "@/components/subscription/SubscriptionHeader";
import { CurrentSubscriptionStatus } from "@/components/subscription/CurrentSubscriptionStatus";
import { SubscriptionPlansDropdown } from "@/components/subscription/SubscriptionPlansDropdown";
import { BillingInformation } from "@/components/subscription/BillingInformation";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (amount?: number, showSuccessModal?: boolean) => void;
}

export const TopUpModal = ({ isOpen, onClose, onSuccess }: TopUpModalProps) => {
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [prorationDetails, setProrationDetails] = useState<any>(null);
  const [pendingUpgrade, setPendingUpgrade] = useState<SubscriptionPlan | null>(null);
  const [refreshingSubscription, setRefreshingSubscription] = useState(false);
  
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { profile, subscription, refreshSubscription } = useAuth();
  const { 
    loading, 
    loadingProration, 
    fetchProrationDetails, 
    processSubscriptionChange, 
    openCustomerPortal 
  } = useSubscriptionOperations();

  const pointsPackages: SubscriptionPlan[] = [
    { credits: 100, price: 100, title: "Pro 1", popular: false },
    { credits: 200, price: 200, title: "Pro 2", popular: false },
    { credits: 300, price: 300, title: "Pro 3", popular: false },
    { credits: 400, price: 400, title: "Pro 4", popular: false },
    { credits: 500, price: 500, title: "Pro 5", popular: true },
    { credits: 600, price: 600, title: "Pro 6", popular: false },
    { credits: 700, price: 700, title: "Pro 7", popular: false },
    { credits: 800, price: 800, title: "Pro 8", popular: false },
    { credits: 900, price: 900, title: "Pro 9", popular: false },
    { credits: 1000, price: 1000, title: "Pro 10", popular: false },
  ];

  const handlePlanSelect = async (plan: SubscriptionPlan) => {
    // If already subscribed, fetch proration details and show confirmation modal
    if (subscription?.subscribed) {
      setPendingUpgrade(plan);
      
      const proration = await fetchProrationDetails(plan.credits);
      if (proration) {
        setProrationDetails(proration);
        setShowConfirmationModal(true);
      }
    } else {
      // Direct subscription for new users
      const result = await processSubscriptionChange(plan.credits, subscription?.subscribed || false);
      if (result.success) {
        // Refresh subscription and profile data
        await refreshSubscription();
        onClose();
        if (onSuccess) {
          onSuccess(plan.price, true);
        }
      }
    }
  };

  const handleUpgradeConfirm = async () => {
    if (pendingUpgrade) {
      const result = await processSubscriptionChange(pendingUpgrade.credits, subscription?.subscribed || false);
      if (result.success) {
        // Refresh subscription and profile data
        await refreshSubscription();
        
        // Force refresh the page to ensure all data is updated
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
        onClose();
        setShowConfirmationModal(false);
        if (onSuccess) {
          onSuccess(pendingUpgrade.price, true);
        }
      }
    }
  };

  const handleManageBilling = async () => {
    const success = await openCustomerPortal();
    if (success) {
      onClose();
    }
  };

  const handleRefreshSubscription = async () => {
    setRefreshingSubscription(true);
    try {
      await refreshSubscription();
      toast({
        title: "Success",
        description: "Subscription status refreshed successfully",
      });
    } catch (error: any) {
      console.error('Error refreshing subscription:', error);
      toast({
        title: "Error",
        description: "Failed to refresh subscription status",
        variant: "destructive",
      });
    } finally {
      setRefreshingSubscription(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={isMobile ? "max-w-[95vw] max-h-[90vh] p-2 overflow-y-auto bg-gradient-to-br from-background via-background/95 to-muted/20 border-2 border-border/50" : "sm:max-w-5xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-background via-background/95 to-muted/20 border-2 border-border/50 shadow-2xl"}>
          <SubscriptionHeader balance={profile?.flexi_credits_balance || 0} />
          
          <div className="space-y-6">
            <CurrentSubscriptionStatus
              hasSubscription={subscription?.subscribed || false}
              planName={subscription?.plan_name}
              creditsPerMonth={subscription?.credits_per_month}
              subscriptionEnd={subscription?.subscription_end}
              balance={profile?.flexi_credits_balance || 0}
              isLoading={loading}
              isRefreshing={refreshingSubscription}
              onManageBilling={handleManageBilling}
              onRefreshStatus={handleRefreshSubscription}
            />

            <SubscriptionPlansDropdown
              plans={pointsPackages}
              currentCredits={subscription?.credits_per_month}
              isLoading={loading || loadingProration}
              onPlanSelect={handlePlanSelect}
              hasSubscription={subscription?.subscribed || false}
            />

            <BillingInformation />
          </div>
        </DialogContent>
      </Dialog>

      <UpgradeConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => {
          setShowConfirmationModal(false);
          setPendingUpgrade(null);
          setProrationDetails(null);
        }}
        onConfirm={handleUpgradeConfirm}
        currentPlan={subscription?.subscribed ? {
          name: subscription.plan_name || "Current Plan",
          credits: subscription.credits_per_month || 0,
          price: subscription.credits_per_month || 0
        } : undefined}
        newPlan={pendingUpgrade ? {
          name: pendingUpgrade.title,
          credits: pendingUpgrade.credits,
          price: pendingUpgrade.price
        } : { name: "", credits: 0, price: 0 }}
        upgradeAmount={prorationDetails?.prorationAmount || (pendingUpgrade && subscription?.subscribed 
          ? pendingUpgrade.price - (subscription.credits_per_month || 0)
          : pendingUpgrade?.price || 0)
        }
        prorationDetails={prorationDetails}
        loading={loading}
      />
    </>
  );
};