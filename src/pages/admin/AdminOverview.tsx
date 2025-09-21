import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { AdminStatsGrid } from "@/components/admin/common/AdminStatsGrid";
import { AdminActivityFeed } from "@/components/admin/common/AdminActivityFeed";
import { AdminErrorBoundary } from "@/components/admin/common/AdminErrorBoundary";
import { useAdminStats } from "@/hooks/admin/useAdminStats";
import { useAdminActivity } from "@/hooks/admin/useAdminActivity";
import { useAdminRealtime } from "@/hooks/admin/useAdminRealtime";

export default function AdminOverview() {
  const { stats, loading: statsLoading, error: statsError, refreshStats } = useAdminStats();
  const { 
    recentActivity, 
    allActivity, 
    activeFilter, 
    filterActivities, 
    loading: activityLoading, 
    error: activityError, 
    refreshActivity 
  } = useAdminActivity();

  // Set up real-time updates
  useAdminRealtime({
    onDataChange: () => {
      refreshStats();
      refreshActivity();
    },
    enabled: true
  });

  const handleRefreshAll = () => {
    refreshStats();
    refreshActivity();
  };

  return (
    <SidebarLayout title="Admin Overview" description="Monitor platform performance and activity">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <AdminNavigation />
        
        <AdminErrorBoundary onRetry={handleRefreshAll}>
          <AdminStatsGrid 
            stats={stats}
            loading={statsLoading}
            error={statsError}
            onRetry={refreshStats}
          />
          
          <AdminActivityFeed
            activities={recentActivity}
            allActivity={allActivity}
            activeFilter={activeFilter}
            loading={activityLoading}
            onFilterChange={filterActivities}
            onRefresh={refreshActivity}
          />
        </AdminErrorBoundary>
      </div>
    </SidebarLayout>
  );
}