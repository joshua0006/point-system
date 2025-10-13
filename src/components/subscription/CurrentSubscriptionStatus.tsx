import { Button } from "@/components/ui/button";
import { CreditCard, RefreshCw } from "lucide-react";

interface CurrentSubscriptionStatusProps {
  hasSubscription: boolean;
  planName?: string;
  creditsPerMonth?: number;
  subscriptionEnd?: string;
  balance: number;
  isLoading: boolean;
  isRefreshing: boolean;
  onManageBilling: () => void;
  onRefreshStatus: () => void;
}

export function CurrentSubscriptionStatus({
  hasSubscription,
  planName,
  creditsPerMonth,
  subscriptionEnd,
  balance,
  isLoading,
  isRefreshing,
  onManageBilling,
  onRefreshStatus
}: CurrentSubscriptionStatusProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-primary rounded-lg p-6 border-2 border-primary-foreground/20">
      <div className="text-center mb-4">
        <h3 className="font-bold text-xl text-primary-foreground mb-2">📅 Current Subscription</h3>
        <p className="text-sm text-primary-foreground/80">
          {hasSubscription ? "Your subscription renews monthly" : "No active subscription"}
        </p>
      </div>

      <div className="text-center">
        <div className="text-lg font-semibold mb-2 text-primary-foreground">
          Current Plan: <span className="font-bold">
            {hasSubscription ? planName || "Active Subscription" : "No Plan"}
          </span>
        </div>

        {hasSubscription && (
          <p className="text-sm text-primary-foreground/80 mb-4">
            {creditsPerMonth} credits/month • Next billing: {formatDate(subscriptionEnd || null)}
          </p>
        )}

        {/* Plan Change Instructions */}
        {hasSubscription && (
          <div className="bg-primary-foreground/10 border border-primary-foreground/20 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-primary-foreground mb-2">💡 How to Change Your Plan</h4>
            <p className="text-sm text-primary-foreground/80 mb-3">
              To upgrade or downgrade your plan, select a new plan below. You'll be redirected to Stripe's secure checkout page to complete the change.
            </p>
            <p className="text-xs text-primary-foreground/80">
              For billing details and payment methods, use "Manage Subscription & Billing" below.
            </p>
          </div>
        )}
        
        <div className="flex flex-col gap-3 justify-center">
          {hasSubscription && (
            <Button
              onClick={onManageBilling}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              size="lg"
            >
              {isLoading ? (
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
            onClick={onRefreshStatus}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            {isRefreshing ? (
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
  );
}