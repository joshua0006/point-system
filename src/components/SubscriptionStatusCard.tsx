import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, CreditCard } from "lucide-react";
import { useState } from "react";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TopUpModal } from "@/components/TopUpModal";
import { formatDate } from "@/utils/dateUtils";

interface SubscriptionStatusCardProps {
  showActions?: boolean;
  compact?: boolean;
}

export const SubscriptionStatusCard = ({ showActions = true, compact = false }: SubscriptionStatusCardProps) => {
  const { profile, subscription, refreshSubscription } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [realTimeBalance, setRealTimeBalance] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch real-time balance from transactions
  const fetchRealTimeBalance = async () => {
    if (!profile?.user_id) return;

    try {
      const { data: transactions, error } = await supabase
        .from('flexi_credits_transactions')
        .select('amount')
        .eq('user_id', profile.user_id);

      if (error) throw error;

      const calculatedBalance = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      setRealTimeBalance(calculatedBalance);
    } catch (error) {
      console.error('Error fetching real-time balance:', error);
      setRealTimeBalance(profile?.flexi_credits_balance || 0);
    }
  };

  // Fetch real-time balance on component mount and when profile changes
  React.useEffect(() => {
    fetchRealTimeBalance();
  }, [profile?.user_id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshSubscription();
      await fetchRealTimeBalance();
      toast({
        title: "Status Updated",
        description: "Subscription status has been refreshed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh subscription status",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleChangePlan = async () => {
    setChangingPlan(true);
    try {
      setPlanModalOpen(true);
      toast({
        title: "Plan Selection",
        description: "Choose your new subscription plan below.",
      });
    } catch (error: any) {
      console.error('Error opening plan modal:', error);
      toast({
        title: "Error",
        description: "Failed to open plan selection",
        variant: "destructive",
      });
    } finally {
      setChangingPlan(false);
    }
  };

  const handleManageBilling = async () => {
    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      window.open(data.url, '_blank');
    } catch (error: any) {
      console.error('Error opening customer portal:', error);

      const isPortalConfigError = error.message?.includes('No configuration provided') ||
                                 error.message?.includes('default configuration has not been created');

      if (isPortalConfigError) {
        toast({
          title: "Customer Portal Not Configured",
          description: "The billing portal needs to be set up in your Stripe dashboard first. Please configure it in your Stripe settings.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to open billing portal",
          variant: "destructive",
        });
      }
    } finally {
      setOpeningPortal(false);
    }
  };

  const getStatusInfo = () => {
    const currentBalance = profile?.flexi_credits_balance || 0;

    if (!subscription) {
      return {
        status: "Loading",
        color: "bg-gray-500",
        textColor: "text-gray-700",
        icon: RefreshCw,
        description: "Checking subscription status...",
        ariaLabel: "Loading subscription status"
      };
    }

    if (subscription.subscribed) {
      return {
        status: "Active",
        color: "bg-green-500",
        textColor: "text-green-700",
        icon: CheckCircle,
        description: `${subscription.plan_name || 'Premium Plan'} - ${subscription.credits_per_month || 0} credits per month`,
        ariaLabel: `Active subscription: ${subscription.plan_name || 'Premium Plan'} with ${subscription.credits_per_month || 0} credits per month`
      };
    }

    if (currentBalance < 0) {
      return {
        status: "Action Required",
        color: "bg-red-500",
        textColor: "text-red-700",
        icon: AlertTriangle,
        description: `Negative balance of ${Math.abs(currentBalance).toLocaleString()} credits. Subscribe or add credits to continue using services.`,
        ariaLabel: `Action required: Negative balance of ${Math.abs(currentBalance).toLocaleString()} credits`
      };
    }

    return {
      status: "No Subscription",
      color: "bg-accent",
      textColor: "text-accent",
      icon: XCircle,
      description: "No active subscription. Subscribe to get monthly credits and unlock premium features.",
      ariaLabel: "No active subscription"
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const balance = profile?.flexi_credits_balance || 0;

  // Compact view for inline display
  if (compact) {
    return (
      <div
        className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border"
        role="region"
        aria-label="Subscription status summary"
      >
        <div className={`w-3 h-3 rounded-full ${statusInfo.color}`} aria-hidden="true"></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm" aria-label={statusInfo.ariaLabel}>
              {statusInfo.status}
            </span>
            {subscription?.subscribed && (
              <Badge variant="secondary" className="text-xs">
                <VisuallyHidden>Monthly credits: </VisuallyHidden>
                {subscription.credits_per_month} credits/mo
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            <VisuallyHidden>Current balance: </VisuallyHidden>
            Balance: {balance.toLocaleString()} credits
          </div>
        </div>
        {showActions && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label={refreshing ? "Refreshing status" : "Refresh subscription status"}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
          </Button>
        )}
      </div>
    );
  }

  // Full card view with comprehensive accessibility
  return (
    <Card
      className="w-full"
      role="region"
      aria-labelledby="subscription-card-title"
    >
      <CardHeader className="pb-3">
        <CardTitle
          id="subscription-card-title"
          className="flex items-center gap-2 text-lg"
        >
          <StatusIcon
            className={`h-5 w-5 ${statusInfo.textColor}`}
            aria-hidden="true"
          />
          <span>Subscription Status</span>
          <Badge
            variant={subscription?.subscribed ? "default" : balance < 0 ? "destructive" : "secondary"}
            className="ml-auto"
            aria-label={statusInfo.ariaLabel}
          >
            {statusInfo.status}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status announcement for screen readers */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {statusInfo.description}
        </div>

        {/* Subscription details using semantic definition list */}
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground mb-1">Current Balance:</dt>
            <dd
              className={`font-semibold text-lg ${balance < 0 ? 'text-red-600' : 'text-green-600'}`}
              aria-label={`Current balance: ${balance.toLocaleString()} credits ${balance < 0 ? 'negative' : ''}`}
            >
              {balance.toLocaleString()} <span className="text-sm font-normal">credits</span>
            </dd>
          </div>

          <div>
            <dt className="text-muted-foreground mb-1">Current Plan:</dt>
            <dd className="font-semibold text-lg">
              {subscription?.subscribed ? subscription.plan_name || 'Premium Plan' : 'No Plan'}
            </dd>
          </div>

          {subscription?.subscribed && (
            <>
              <div>
                <dt className="text-muted-foreground mb-1">Monthly Credits:</dt>
                <dd className="font-semibold">
                  {subscription.credits_per_month || 0} <span className="text-sm font-normal">credits</span>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground mb-1">Next Billing:</dt>
                <dd className="font-semibold">
                  {formatDate(subscription.subscription_end)}
                </dd>
              </div>
            </>
          )}
        </dl>

        {/* Status description with proper contrast */}
        <div
          className="text-sm bg-muted/40 p-4 rounded-lg border border-muted-foreground/20"
          role="status"
          aria-live="polite"
        >
          <p className="leading-relaxed">
            {subscription?.subscribed
              ? `Your ${subscription.plan_name || 'Premium Plan'} subscription provides ${subscription.credits_per_month || 0} credits monthly. Your next billing date is ${formatDate(subscription.subscription_end)}.`
              : statusInfo.description
            }
          </p>
        </div>

        {/* Action buttons with proper accessibility */}
        {showActions && (
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Subscription actions">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label={refreshing ? "Refreshing subscription status" : "Refresh subscription status"}
              className="focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              {refreshing ? 'Refreshing...' : 'Refresh'}
              {refreshing && <VisuallyHidden>Please wait, refreshing subscription status</VisuallyHidden>}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleChangePlan}
              disabled={changingPlan}
              aria-label="Change subscription plan"
              className="focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <CreditCard className="h-4 w-4 mr-2" aria-hidden="true" />
              {changingPlan ? 'Opening...' : 'Change Plan'}
              {changingPlan && <VisuallyHidden>Please wait, opening plan selection</VisuallyHidden>}
            </Button>

            {subscription?.subscribed && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageBilling}
                disabled={openingPortal}
                aria-label="Manage subscription billing and payment methods"
                className="focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <CreditCard className="h-4 w-4 mr-2" aria-hidden="true" />
                {openingPortal ? 'Opening...' : 'Manage Billing'}
                {openingPortal && <VisuallyHidden>Please wait, opening billing portal</VisuallyHidden>}
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <TopUpModal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        aria-label="Top up credits modal"
      />
    </Card>
  );
};
