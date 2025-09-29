import { memo } from "react";
import { UserManagementContainer } from "@/components/admin/users/UserManagementContainer";
import type { UserProfile } from "@/config/types";

interface OptimizedUserManagementProps {
  onUserAction?: (user: UserProfile, action: string) => void;
}

export const OptimizedUserManagement = memo(function OptimizedUserManagement({ 
  onUserAction 
}: OptimizedUserManagementProps) {
  return <UserManagementContainer onUserAction={onUserAction} />;
});