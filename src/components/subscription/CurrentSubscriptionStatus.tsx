interface CurrentSubscriptionStatusProps {
  hasSubscription: boolean;
  planName?: string;
  creditsPerMonth?: number;
  subscriptionEnd?: string;
  balance: number;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onManageBilling?: () => Promise<void>;
  onRefreshStatus?: () => Promise<void>;
}

export function CurrentSubscriptionStatus({
  hasSubscription,
  planName,
  creditsPerMonth,
  subscriptionEnd,
  balance
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
    <div className="bg-primary rounded-lg border-2 border-primary-foreground/20 w-full">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header - Full Width */}
        <div className="text-center mb-3">
          <h3 className="font-bold text-xl text-primary-foreground mb-1">📅 Current Subscription</h3>
          <p className="text-sm text-primary-foreground/80">
            {hasSubscription ? "Your subscription renews monthly" : "No active subscription"}
          </p>
        </div>

        {/* Three Column Layout - Subscription Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1 - Current Plan */}
          <div className="text-center">
            <p className="text-xs text-primary-foreground/70 mb-1">Current Plan</p>
            <p className="text-lg font-semibold text-primary-foreground">
              {hasSubscription ? planName || "Active Subscription" : "No Plan"}
            </p>
          </div>

          {/* Column 2 - Credits per Month */}
          <div className="text-center">
            <p className="text-xs text-primary-foreground/70 mb-1">Credits per Month</p>
            <p className="text-lg font-semibold text-primary-foreground">
              {hasSubscription ? `${creditsPerMonth} credits` : "0 credits"}
            </p>
          </div>

          {/* Column 3 - Next Billing */}
          <div className="text-center">
            <p className="text-xs text-primary-foreground/70 mb-1">Next Billing</p>
            <p className="text-lg font-semibold text-primary-foreground">
              {hasSubscription ? formatDate(subscriptionEnd || null) : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}