import { memo } from "react";
import { ReactNode } from "react";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { AdminErrorBoundary } from "@/components/admin/common/AdminErrorBoundary";

interface AdminPageContainerProps {
  title: string;
  description: string;
  children: ReactNode;
  onRetry?: () => void;
}

export const AdminPageContainer = memo(function AdminPageContainer({ 
  title, 
  description, 
  children, 
  onRetry 
}: AdminPageContainerProps) {
  return (
    <SidebarLayout title={title} description={description}>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <AdminNavigation />
        
        <AdminErrorBoundary onRetry={onRetry}>
          {children}
        </AdminErrorBoundary>
      </div>
    </SidebarLayout>
  );
});