import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import { useAdminBilling } from "@/hooks/useAdminBilling";
import { 
  DollarSign, 
  Users, 
  CreditCard, 
  TrendingUp,
  Coins,
  Activity,
  PiggyBank,
  Receipt
} from "lucide-react";

export function BillingOverview() {
  const { data: stats, isLoading, error } = useAdminBilling();

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            Failed to load billing overview. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Revenue"
          value={`${(stats?.totalRevenue || 0).toLocaleString()} pts`}
          subtitle="Lifetime earnings"
          icon={DollarSign}
          loading={isLoading}
          variant="success"
        />
        
        <StatsCard
          title="Monthly Recurring"
          value={`${(stats?.monthlyRecurringRevenue || 0).toLocaleString()} pts`}
          subtitle="MRR from subscriptions"
          icon={TrendingUp}
          loading={isLoading}
          variant="primary"
        />
        
        <StatsCard
          title="Active Subscriptions"
          value={stats?.activeSubscriptions || 0}
          subtitle="Paying subscribers"
          icon={CreditCard}
          loading={isLoading}
        />
        
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          subtitle="Registered users"
          icon={Users}
          loading={isLoading}
        />
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Top-Up Revenue"
          value={(stats?.topUpRevenue || 0).toLocaleString()}
          subtitle="From point purchases"
          icon={PiggyBank}
          loading={isLoading}
          className="text-success"
        />
        
        <StatsCard
          title="Subscription Revenue"
          value={(stats?.subscriptionRevenue || 0).toLocaleString()}
          subtitle="From subscriptions"
          icon={Receipt}
          loading={isLoading}
          className="text-primary"
        />
        
        <StatsCard
          title="Avg User Balance"
          value={Math.round(stats?.averageUserBalance || 0).toLocaleString()}
          subtitle="Points per user"
          icon={Coins}
          loading={isLoading}
          className="text-accent"
        />
        
        <StatsCard
          title="Total Transactions"
          value={(stats?.totalTransactions || 0).toLocaleString()}
          subtitle="All time"
          icon={Activity}
          loading={isLoading}
        />
      </div>

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subscription Rate</span>
                <Badge variant="secondary">
                  {stats?.totalUsers 
                    ? Math.round((stats.activeSubscriptions / stats.totalUsers) * 100)
                    : 0}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Revenue per User</span>
                <Badge variant="outline">
                  {stats?.totalUsers 
                    ? Math.round(stats.totalRevenue / stats.totalUsers)
                    : 0} pts
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Top-Up vs Subscription</span>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {stats?.totalRevenue 
                      ? Math.round((stats.topUpRevenue / stats.totalRevenue) * 100)
                      : 0}% / {stats?.totalRevenue 
                      ? Math.round((stats.subscriptionRevenue / stats.totalRevenue) * 100)
                      : 0}%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Transactions per User</span>
                <Badge variant="outline">
                  {stats?.totalUsers 
                    ? Math.round(stats.totalTransactions / stats.totalUsers)
                    : 0}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}