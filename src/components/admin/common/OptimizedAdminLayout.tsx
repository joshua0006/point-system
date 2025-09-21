import { memo, ReactNode, Suspense } from "react";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { AdminErrorBoundary } from "@/components/admin/common/AdminErrorBoundary";
import { CardSkeleton } from "@/components/ui/optimized-skeleton";

interface OptimizedAdminLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  onRetry?: () => void;
  loading?: boolean;
}

export const OptimizedAdminLayout = memo(function OptimizedAdminLayout({ 
  title, 
  description, 
  children, 
  onRetry,
  loading = false
}: OptimizedAdminLayoutProps) {
  return (
    <SidebarLayout title={title} description={description}>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <AdminNavigation />
        
        <AdminErrorBoundary onRetry={onRetry}>
          {loading ? (
            <div className="space-y-6">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : (
            <Suspense fallback={
              <div className="space-y-6">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            }>
              {children}
            </Suspense>
          )}
        </AdminErrorBoundary>
      </div>
    </SidebarLayout>
  );
});