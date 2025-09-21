import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { AdminDashboardStats } from "@/components/admin/AdminDashboardStats";
import { AdminActivityLog } from "@/components/admin/AdminActivityLog";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

export default function AdminOverview() {
  const { stats, recentActivity, allActivity, activeFilter, filterActivities, loading, error, refreshData } = useAdminDashboard();

  return (
    <SidebarLayout title="Admin Overview" description="Monitor platform performance and activity">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <AdminNavigation />
        <AdminDashboardStats stats={stats} loading={loading} error={error} />
        <AdminActivityLog 
          recentActivity={recentActivity}
          allActivity={allActivity}
          activeFilter={activeFilter}
          loading={loading}
          onFilterActivities={filterActivities}
          onRefreshData={refreshData}
        />
      </div>
    </SidebarLayout>
  );
}