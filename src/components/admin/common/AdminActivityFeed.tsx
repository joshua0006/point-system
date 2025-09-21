import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, RefreshCw } from "lucide-react";
import { RecentActivity } from "@/hooks/admin/useAdminActivity";
import { ACTIVITY_FILTERS } from "@/utils/admin/adminConstants";
import { getActivityCategoryStyles } from "@/utils/admin/adminHelpers";

interface AdminActivityFeedProps {
  activities: RecentActivity[];
  allActivity?: RecentActivity[];
  activeFilter: string;
  loading: boolean;
  onFilterChange: (filter: string) => void;
  onRefresh: () => void;
}

export function AdminActivityFeed({ 
  activities, 
  allActivity, 
  activeFilter, 
  loading, 
  onFilterChange, 
  onRefresh 
}: AdminActivityFeedProps) {
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
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-2 text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        
        {/* Activity Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          {ACTIVITY_FILTERS.map((filter) => (
            <button
              key={filter.key}
              onClick={() => onFilterChange(filter.key)}
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
          <ActivitySkeleton />
        ) : activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <EmptyState activeFilter={activeFilter} />
        )}
      </CardContent>
    </Card>
  );
}

function ActivityItem({ activity }: { activity: RecentActivity }) {
  const categoryStyles = getActivityCategoryStyles(activity.category);

  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border mt-0.5">
        <span className="text-sm">{activity.emoji || '📊'}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-relaxed">{activity.description}</p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
            <Badge className={`text-xs ${categoryStyles}`}>
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
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-start space-x-3">
          <Skeleton className="w-8 h-8 rounded-full mt-0.5" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-12 rounded-full" />
              </div>
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ activeFilter }: { activeFilter: string }) {
  return (
    <div className="text-center py-12">
      <Activity className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
      <p className="text-sm text-muted-foreground">
        {activeFilter === "all" 
          ? "No recent activity to display" 
          : `No ${activeFilter} activities found`
        }
      </p>
    </div>
  );
}