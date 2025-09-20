import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  DollarSign, 
  Calendar,
  UserCheck,
  AlertCircle
} from "lucide-react";
import { AdminStats } from "@/hooks/useAdminDashboard";

interface AdminDashboardStatsProps {
  stats?: AdminStats;
  loading: boolean;
  error: string | null;
}

export function AdminDashboardStats({ stats, loading, error }: AdminDashboardStatsProps) {
  if (error) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            Total Users
            <Users className="w-4 h-4 text-primary" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20 mb-2" />
          ) : (
            <div className="text-2xl font-bold text-foreground">{(stats?.totalUsers || 0).toLocaleString()}</div>
          )}
          <p className="text-xs text-muted-foreground">total registered users</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            Active Consultants
            <UserCheck className="w-4 h-4 text-success" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-16 mb-2" />
          ) : (
            <div className="text-2xl font-bold text-foreground">{stats?.activeConsultants || 0}</div>
          )}
          {loading ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <p className="text-xs text-muted-foreground">{stats?.activeServices || 0} services listed</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-accent to-accent/80 text-accent-foreground">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            Monthly Volume
            <DollarSign className="w-4 h-4" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24 mb-2 bg-accent-foreground/20" />
          ) : (
            <div className="text-2xl font-bold">{(stats?.monthlyVolume || 0).toLocaleString()}</div>
          )}
          <p className="text-xs opacity-90">points transacted</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            Active Bookings
            <Calendar className="w-4 h-4 text-primary" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-16 mb-2" />
          ) : (
            <div className="text-2xl font-bold text-foreground">{stats?.activeBookings || 0}</div>
          )}
          <p className="text-xs text-muted-foreground">pending & confirmed</p>
        </CardContent>
      </Card>
    </div>
  );
}