import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Wallet, 
  Calendar, 
  TrendingUp,
  CheckCircle
} from "lucide-react";
import { UserStats } from "@/hooks/useDashboard";
import { memo, useMemo } from "react";

interface DashboardStatsProps {
  userStats: UserStats;
  onBalanceClick: () => void;
  onSpentClick: () => void;
  onServicesClick: () => void;
  onCompletionClick: () => void;
}

export const DashboardStats = memo(({ 
  userStats, 
  onBalanceClick, 
  onSpentClick, 
  onServicesClick, 
  onCompletionClick 
}: DashboardStatsProps) => {
  const completionRate = useMemo(() => {
    return userStats.servicesBooked > 0 
      ? Math.round((userStats.completedSessions / userStats.servicesBooked) * 100) 
      : 0;
  }, [userStats.completedSessions, userStats.servicesBooked]);

  const balanceDisplay = useMemo(() => ({
    amount: Math.abs(userStats.totalPoints).toLocaleString(),
    isNegative: userStats.totalPoints < 0,
    label: userStats.totalPoints < 0 ? 'points owed' : 'points available',
    displayText: userStats.totalPoints < 0 
      ? `Owes ${Math.abs(userStats.totalPoints).toLocaleString()} pts`
      : `${Math.abs(userStats.totalPoints).toLocaleString()}`
  }), [userStats.totalPoints]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card 
        className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground cursor-pointer hover:scale-105 transition-transform"
        onClick={onBalanceClick}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            Current Balance
            <Wallet className="w-4 h-4" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${balanceDisplay.isNegative ? 'text-destructive' : ''}`}>
            {balanceDisplay.displayText}
          </div>
          <p className="text-xs opacity-90">
            {balanceDisplay.label}
          </p>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:scale-105 transition-transform"
        onClick={onSpentClick}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            Total Spent
            <TrendingUp className="w-4 h-4 text-destructive" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{userStats.pointsSpent.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">points this month</p>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:scale-105 transition-transform"
        onClick={onServicesClick}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            Services Booked
            <Calendar className="w-4 h-4 text-primary" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{userStats.servicesBooked}</div>
          <p className="text-xs text-muted-foreground">sessions total</p>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:scale-105 transition-transform"
        onClick={onCompletionClick}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            Completion Rate
            <CheckCircle className="w-4 h-4 text-success" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {completionRate}%
          </div>
          <Progress 
            value={completionRate} 
            className="mt-2" 
          />
        </CardContent>
      </Card>
    </div>
  );
});