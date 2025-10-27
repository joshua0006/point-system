import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from '@/lib/icons';
import { RecentActivity } from "@/hooks/useAdminDashboard";

interface AdminActivityLogProps {
  recentActivity: RecentActivity[];
  allActivity?: RecentActivity[];
  activeFilter: string;
  loading: boolean;
  onFilterActivities: (filter: string) => void;
  onRefreshData: () => void;
}

const ACTIVITY_FILTERS = [
  { key: "all", label: "All", icon: "🔍" },
  { key: "credit", label: "Credits", icon: "💰" },
  { key: "debit", label: "Debits", icon: "💸" },
  { key: "campaign", label: "Campaigns", icon: "🎯" },
  { key: "subscription", label: "Subscriptions", icon: "📋" },
  { key: "booking", label: "Bookings", icon: "📅" },
  { key: "system", label: "System", icon: "🔧" },
];

export function AdminActivityLog({ 
  recentActivity, 
  allActivity, 
  activeFilter, 
  loading, 
  onFilterActivities, 
  onRefreshData 
}: AdminActivityLogProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Flexi Credits Activity Log</span>
            <Badge variant="outline" className="text-xs">
              {allActivity?.length || 0} total
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshData}
              disabled={loading}
              className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {ACTIVITY_FILTERS.map((filter) => (
            <button
              key={filter.key}
              onClick={() => onFilterActivities(filter.key)}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                activeFilter === filter.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {filter.icon} {filter.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="w-2 h-2 rounded-full mt-2" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : recentActivity.length > 0 ? (
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border mt-0.5">
                  <span className="text-sm">{activity.emoji || '📊'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed">{activity.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          activity.category === 'credit' ? 'bg-green-100 text-green-800' :
                          activity.category === 'debit' ? 'bg-red-100 text-red-800' :
                          activity.category === 'campaign' ? 'bg-blue-100 text-blue-800' :
                          activity.category === 'subscription' ? 'bg-purple-100 text-purple-800' :
                          activity.category === 'booking' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {activity.category}
                      </Badge>
                    </div>
                    {activity.points > 0 && (
                      <Badge variant="outline" className="text-xs font-mono">
                        {activity.category === 'credit' ? '+' : activity.category === 'debit' ? '-' : ''}{activity.points} pts
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              {activeFilter === "all" 
                ? "No recent activity to display" 
                : `No ${activeFilter} activities found`
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}