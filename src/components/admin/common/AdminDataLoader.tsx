import { memo, Suspense } from "react";
import { useOptimizedAdminData } from "@/hooks/useOptimizedAdminData";
import { useAdminRealtime } from "@/hooks/admin/useAdminRealtime";
import { CardSkeleton } from "@/components/ui/optimized-skeleton";
import { ErrorBoundary } from "@/components/ui/error-boundary";

interface AdminDataLoaderProps {
  children: (data: ReturnType<typeof useOptimizedAdminData>) => React.ReactNode;
  enableRealtime?: boolean;
}

export const AdminDataLoader = memo(function AdminDataLoader({
  children,
  enableRealtime = true
}: AdminDataLoaderProps) {
  const adminData = useOptimizedAdminData();
  
  // Set up real-time updates
  useAdminRealtime({
    enabled: enableRealtime,
    onDataChange: () => {
      adminData.refreshStats();
      adminData.refreshUsers();
    }
  });

  if (adminData.isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={
      <div className="text-center text-muted-foreground py-8">
        Failed to load admin data. Please try refreshing.
      </div>
    }>
      <Suspense fallback={
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      }>
        {children(adminData)}
      </Suspense>
    </ErrorBoundary>
  );
});