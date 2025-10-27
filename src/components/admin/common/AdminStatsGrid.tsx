import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { 
  Users, 
  DollarSign, 
  Calendar,
  UserCheck,
  AlertCircle
} from '@/lib/icons';
import { AdminStats } from "@/hooks/admin/useAdminStats";

interface AdminStatsGridProps {
  stats?: AdminStats;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export function AdminStatsGrid({ stats, loading, error, onRetry }: AdminStatsGridProps) {
  if (error) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <p>{error}</p>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-sm text-primary hover:text-primary/80 underline"
              >
                Try again
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
      <StatsCard
        title="Total Users"
        value={stats?.totalUsers || 0}
        subtitle="total registered users"
        icon={Users}
        loading={loading}
        variant="default"
      />

      <StatsCard
        title="Active Consultants"
        value={stats?.activeConsultants || 0}
        subtitle={`${stats?.activeServices || 0} services listed`}
        icon={UserCheck}
        loading={loading}
        variant="success"
      />

      <StatsCard
        title="Monthly Volume"
        value={(stats?.monthlyVolume || 0).toLocaleString()}
        subtitle="points transacted"
        icon={DollarSign}
        loading={loading}
        variant="accent"
      />

      <StatsCard
        title="Active Bookings"
        value={stats?.activeBookings || 0}
        subtitle="pending & confirmed"
        icon={Calendar}
        loading={loading}
        variant="primary"
      />
    </div>
  );
}