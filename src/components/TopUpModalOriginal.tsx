import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, CreditCard, RefreshCw, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/utils/dateUtils";
import { UpgradeConfirmationModal } from "@/components/UpgradeConfirmationModal";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (amount?: number, showSuccessModal?: boolean) => void;
}

export const TopUpModal = ({ isOpen, onClose, onSuccess }: TopUpModalProps) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshingSubscription, setRefreshingSubscription] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [prorationDetails, setProrationDetails] = useState<{
    currentAmount: number;
    newAmount: number;
    prorationAmount: number;
    nextBillingDate: string;
  } | null>(null);
  const [loadingProration, setLoadingProration] = useState(false);
  const [pendingUpgrade, setPendingUpgrade] = useState<{
    credits: number;
    price: number;
    title: string;
  } | null>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { profile, subscription, refreshSubscription, refreshProfile } = useAuth();

  const pointsPackages = [
    { points: 100, price: 100, title: "Pro 1", popular: false },
    { points: 200, price: 200, title: "Pro 2", popular: false },
    { points: 300, price: 300, title: "Pro 3", popular: false },
    { points: 400, price: 400, title: "Pro 4", popular: false },
    { points: 500, price: 500, title: "Pro 5", popular: true },
    { points: 600, price: 600, title: "Pro 6", popular: false },
    { points: 700, price: 700, title: "Pro 7", popular: false },
    { points: 800, price: 800, title: "Pro 8", popular: false },
    { points: 900, price: 900, title: "Pro 9", popular: false },
    { points: 1000, price: 1000, title: "Pro 10", popular: false },
  ];


  const handleSubscribe = async (credits: number, price: number, title: string) => {
    // If already subscribed, fetch proration details and show confirmation modal
    if (subscription?.subscribed) {
      setPendingUpgrade({ credits, price, title });
      
      // Fetch proration details
      setLoadingProration(true);
      try {
        const { data, error } = await supabase.functions.invoke('preview-subscription-change', {
          body: { credits }
        });
        
        if (error) throw error;
        
        setProrationDetails(data);
        setShowConfirmationModal(true);
      } catch (error: any) {
        console.error('Error fetching proration details:', error);
        toast({
          title: "Error",
          description: "Failed to calculate proration. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingProration(false);
      }
    } else {
      // Direct subscription for new users
      await processSubscription(credits, price);
    }
  };

  const processSubscription = async (credits: number, price: number) => {
    setSelectedAmount(credits);
    setLoading(true);
    
    try {
      // ALL subscription changes (new subscriptions AND upgrades) go through Stripe checkout
      // We don't store credit card info and don't charge immediately
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: { credits }
      });
      
      if (error) throw error;
      
      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      
      // Show info message about checkout process
      toast({
        title: "Redirected to Stripe Checkout",
        description: "Complete your payment in the new tab to activate your subscription.",
      });
      
      // Close the modal
      onClose();
      setShowConfirmationModal(false);
      
    } catch (error: any) {
      console.error('Error processing subscription:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process subscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeConfirm = async () => {
    // For both existing and new subscribers, use checkout for upgrades
    if (pendingUpgrade) {
      await processSubscription(pendingUpgrade.credits, pendingUpgrade.price);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      // Open Stripe customer portal in a new tab
      window.open(data.url, '_blank');
      
      // Close the modal
      onClose();
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  // Remove formatDate function - using utility instead

  const isCurrentPlan = (credits: number) => {
    return subscription?.subscribed && subscription?.credits_per_month === credits;
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={isMobile ? "max-w-[95vw] max-h-[90vh] p-2 overflow-y-auto bg-gradient-to-br from-background via-background/95 to-muted/20 border-2 border-border/50" : "sm:max-w-5xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-background via-background/95 to-muted/20 border-2 border-border/50 shadow-2xl"}>
        <DialogHeader className="text-center pb-8 border-b border-border/30">
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Subscription Management
          </DialogTitle>
          <div className="flex items-center justify-center gap-3 mt-4 p-3 rounded-lg bg-muted/30 border border-border/20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-sm font-medium text-muted-foreground">Current Balance:</span>
            </div>
            <span className="font-bold text-lg text-primary">
              {profile?.flexi_credits_balance?.toLocaleString() || '0'} flexi-credits
            </span>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Subscription Status */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 border-2 border-primary/20">
            <div className="text-center mb-4">
              <h3 className="font-bold text-xl text-primary mb-2">📅 Current Subscription</h3>
              <p className="text-sm text-muted-foreground">
                {subscription?.subscribed ? "Your subscription renews monthly" : "No active subscription"}
              </p>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold mb-2">
                Current Plan: <span className="text-primary">
                  {subscription?.subscribed ? subscription.plan_name || "Active Subscription" : "No Plan"}
                </span>
              </div>
              {subscription?.subscribed && (
                <p className="text-sm text-muted-foreground mb-4">
                  {subscription.credits_per_month} credits/month • Next billing: {formatDate(subscription.subscription_end)}
                </p>
              )}
              
              {/* Plan Change Instructions */}
              {subscription?.subscribed && (
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 How to Change Your Plan</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    To upgrade or downgrade your plan, select a new plan below. You'll be redirected to Stripe's secure checkout page to complete the change.
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    For billing details and payment methods, use "Manage Subscription & Billing" below.
                  </p>
                </div>
              )}
              
              <div className="flex flex-col gap-3 justify-center">
                {subscription?.subscribed && (
                  <Button
                    onClick={handleManageSubscription}
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    size="lg"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Manage Subscription & Billing
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={handleRefreshSubscription}
                  disabled={refreshingSubscription}
                  variant="outline"
                  size="sm"
                >
                  {refreshingSubscription ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Refreshing...
                    </div>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Refresh Status
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>


          {/* Subscription Plans Grid */}
          <div className={isMobile ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"}>
            {pointsPackages.map((pkg) => (
              <Card 
                key={pkg.points} 
                className={`relative border-2 transition-all hover:shadow-lg ${
                  isCurrentPlan(pkg.points)
                    ? 'border-green-500 bg-green-50/50 shadow-lg scale-105' 
                    : pkg.popular 
                    ? 'border-primary shadow-lg scale-105' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {isCurrentPlan(pkg.points) && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-600">
                    Current Plan
                  </Badge>
                )}
                {pkg.popular && !isCurrentPlan(pkg.points) && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-lg mb-2">{pkg.title}</h3>
                  <div className="mb-4">
                    <div className="text-3xl font-bold">
                      S${pkg.price}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      per month
                    </div>
                    <div className="text-sm font-medium text-primary">
                      {pkg.points} flexi-credits/month
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-6 text-center">
                    Monthly subscription
                  </div>
                  
                   <Button
                     onClick={() => handleSubscribe(pkg.points, pkg.price, pkg.title)}
                     disabled={loading || isCurrentPlan(pkg.points) || loadingProration}
                     className={`w-full ${
                       isCurrentPlan(pkg.points)
                         ? 'bg-green-600 hover:bg-green-600'
                         : pkg.popular 
                         ? 'bg-primary hover:bg-primary/90' 
                         : ''
                     }`}
                     variant={isCurrentPlan(pkg.points) ? "default" : pkg.popular ? "default" : "outline"}
                   >
                     {(loading && selectedAmount === pkg.points) || loadingProration ? (
                       <div className="flex items-center gap-2">
                         <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                         {loadingProration ? "Calculating..." : "Processing..."}
                       </div>
                      ) : isCurrentPlan(pkg.points) ? (
                        "Current Plan"
                      ) : subscription?.subscribed ? (
                        pkg.points > (subscription.credits_per_month || 0) 
                          ? `Upgrade to ${pkg.title}` 
                          : `Downgrade to ${pkg.title}`
                      ) : (
                       `Subscribe to ${pkg.title}`
                     )}
                   </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Billing Information */}
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <h4 className="font-semibold text-primary mb-2">💡 Billing Details</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• <strong>Secure Checkout:</strong> All payments processed through Stripe's secure checkout</p>
              <p>• <strong>No Stored Cards:</strong> We don't store your payment information</p>
              <p>• <strong>Credit rollover:</strong> Unused credits never expire, even after cancellation</p>
              <p>• <strong>Cancellation:</strong> Cancel anytime, keep all unused credits forever</p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-6 py-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-green-600" />
              SSL Secured
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4 text-blue-600" />
              PCI Compliant
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-yellow-600" />
              Instant Processing
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Upgrade Confirmation Modal */}
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
    </Dialog>
  );
};