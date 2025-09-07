import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, CreditCard } from "lucide-react";
import { useState } from "react";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionStatusCardProps {
  showActions?: boolean;
  compact?: boolean;
}

export const SubscriptionStatusCard = ({ showActions = true, compact = false }: SubscriptionStatusCardProps) => {
  const { profile, subscription, refreshSubscription } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
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
      await fetchRealTimeBalance(); // Also refresh the balance
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

  const handleManageBilling = async () => {
    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      window.open(data.url, '_blank');
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal",
        variant: "destructive",
      });
    } finally {
      setOpeningPortal(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusInfo = () => {
    const currentBalance = profile?.flexi_credits_balance || 0;
    
    if (!subscription) {
      return {
        status: "Loading",
        color: "bg-gray-500",
        icon: RefreshCw,
        description: "Checking subscription status..."
      };
    }

    if (subscription.subscribed) {
      return {
        status: "Active",
        color: "bg-green-500",
        icon: CheckCircle,
        description: `${subscription.plan_name || 'Premium Plan'} - ${subscription.credits_per_month || 0} credits/month`
      };
    }

    // Check if user has negative balance using real-time balance
    if (currentBalance < 0) {
      return {
        status: "Action Required",
        color: "bg-red-500",
        icon: AlertTriangle,
        description: `Negative balance (${currentBalance.toLocaleString()} credits). Subscribe or add credits to continue using services.`
      };
    }

    return {
      status: "No Subscription",
      color: "bg-yellow-500",
      icon: XCircle,
      description: "No active subscription. Subscribe to get monthly credits."
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const balance = profile?.flexi_credits_balance || 0;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border">
        <div className={`w-3 h-3 rounded-full ${statusInfo.color}`}></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{statusInfo.status}</span>
            {subscription?.subscribed && (
              <Badge variant="secondary" className="text-xs">
                {subscription.credits_per_month} credits/mo
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            Balance: {balance.toLocaleString()} credits
          </div>
        </div>
        {showActions && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <StatusIcon className={`h-5 w-5 ${statusInfo.color.replace('bg-', 'text-')}`} />
          Subscription Status
          <Badge 
            variant={subscription?.subscribed ? "default" : balance < 0 ? "destructive" : "secondary"}
            className="ml-auto"
          >
            {statusInfo.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Current Balance:</span>
            <div className={`font-semibold ${balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {balance.toLocaleString()} credits
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Plan:</span>
            <div className="font-semibold">
              {subscription?.subscribed ? subscription.plan_name || 'Premium' : 'No Plan'}
            </div>
          </div>
          {subscription?.subscribed && (
            <>
              <div>
                <span className="text-muted-foreground">Monthly Credits:</span>
                <div className="font-semibold">{subscription.credits_per_month || 0}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Next Billing:</span>
                <div className="font-semibold">{formatDate(subscription.subscription_end)}</div>
              </div>
            </>
          )}
        </div>

        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
          {statusInfo.description}
        </div>

        {showActions && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            {subscription?.subscribed && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageBilling}
                disabled={openingPortal}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {openingPortal ? 'Opening...' : 'Manage Billing'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};