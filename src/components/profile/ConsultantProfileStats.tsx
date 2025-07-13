
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calendar, Award, Clock } from 'lucide-react';

interface ConsultantProfileStatsProps {
  servicesCount: number;
  bookingStats: { total: number; completed: number } | undefined;
  onAllServicesClick: () => void;
}

export function ConsultantProfileStats({ 
  servicesCount, 
  bookingStats, 
  onAllServicesClick 
}: ConsultantProfileStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onAllServicesClick}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            Active Services
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {servicesCount || 0}
          </div>
          <p className="text-xs text-muted-foreground">click to view all</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            Total Bookings
            <Calendar className="w-4 h-4 text-primary" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {bookingStats?.total || 0}
          </div>
          <p className="text-xs text-muted-foreground">sessions booked</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            Completed
            <Award className="w-4 h-4 text-success" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {bookingStats?.completed || 0}
          </div>
          <p className="text-xs text-muted-foreground">successful sessions</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            Response Rate
            <Clock className="w-4 h-4 text-accent" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">-</div>
          <p className="text-xs text-muted-foreground">no data available</p>
        </CardContent>
      </Card>
    </div>
  );
}
