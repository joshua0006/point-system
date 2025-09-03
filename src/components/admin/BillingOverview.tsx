import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
        <Card className="bg-gradient-to-br from-success to-success/80 text-success-foreground">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Total Revenue
              <DollarSign className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mb-2 bg-success-foreground/20" />
            ) : (
              <div className="text-2xl font-bold">
                {(stats?.totalRevenue || 0).toLocaleString()} pts
              </div>
            )}
            <p className="text-xs opacity-90">Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Monthly Recurring
              <TrendingUp className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20 mb-2 bg-primary-foreground/20" />
            ) : (
              <div className="text-2xl font-bold">
                {(stats?.monthlyRecurringRevenue || 0).toLocaleString()} pts
              </div>
            )}
            <p className="text-xs opacity-90">MRR from subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Active Subscriptions
              <CreditCard className="w-4 h-4 text-accent" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mb-2" />
            ) : (
              <div className="text-2xl font-bold text-accent">
                {stats?.activeSubscriptions || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Paying subscribers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Total Users
              <Users className="w-4 h-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mb-2" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {stats?.totalUsers || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Top-Up Revenue
              <PiggyBank className="w-4 h-4 text-success" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20 mb-2" />
            ) : (
              <div className="text-2xl font-bold text-success">
                {(stats?.topUpRevenue || 0).toLocaleString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">From point purchases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Subscription Revenue
              <Receipt className="w-4 h-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20 mb-2" />
            ) : (
              <div className="text-2xl font-bold text-primary">
                {(stats?.subscriptionRevenue || 0).toLocaleString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">From subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Avg User Balance
              <Coins className="w-4 h-4 text-accent" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20 mb-2" />
            ) : (
              <div className="text-2xl font-bold text-accent">
                {Math.round(stats?.averageUserBalance || 0).toLocaleString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Points per user</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Total Transactions
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20 mb-2" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {(stats?.totalTransactions || 0).toLocaleString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
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