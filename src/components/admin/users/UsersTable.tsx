import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Eye, EyeOff } from '@/lib/icons';
import { UserTableRow } from "./UserTableRow";
import type { UserProfile } from "@/config/types";

interface UsersTableProps {
  users: UserProfile[];
  onRefresh: () => void;
  onTopUp: (user: UserProfile) => void;
  onDeduct: (user: UserProfile) => void;
  onBilling: (user: UserProfile) => void;
  onRevoke: (user: UserProfile) => void;
  onDelete: (user: UserProfile) => void;
  onUserDetails: (user: UserProfile) => void;
  onViewSubscription: (user: UserProfile) => void;
  onServiceAssignment: (user: UserProfile) => void;
  onAwardCredits: (user: UserProfile) => void;
  onToggleHide: (user: UserProfile) => void;
  getSubscription: (userId: string) => any;
  isSubscriptionLoading: (userId: string) => boolean;
  userRole: string;
  showHiddenUsers: boolean;
  onToggleShowHidden: () => void;
  hiddenUsersCount: number;
}

export const UsersTable = memo(function UsersTable({
  users,
  onRefresh,
  onTopUp,
  onDeduct,
  onBilling,
  onRevoke,
  onDelete,
  onUserDetails,
  onViewSubscription,
  onServiceAssignment,
  onAwardCredits,
  onToggleHide,
  getSubscription,
  isSubscriptionLoading,
  userRole,
  showHiddenUsers,
  onToggleShowHidden,
  hiddenUsersCount
}: UsersTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>User Management</CardTitle>
            {hiddenUsersCount > 0 && (
              <Badge variant="secondary">
                {hiddenUsersCount} hidden
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hiddenUsersCount > 0 && (
              <Button 
                onClick={onToggleShowHidden} 
                variant="outline" 
                size="sm"
              >
                {showHiddenUsers ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Hide Hidden Users
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Show Hidden Users ({hiddenUsersCount})
                  </>
                )}
              </Button>
            )}
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="min-w-[1200px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Flexi Credits Balance</TableHead>
                  <TableHead>Awarded Flexi Credits (AFC)</TableHead>
                  <TableHead>Member Since</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <UserTableRow
                    key={user.id}
                    user={user}
                    onTopUp={onTopUp}
                    onDeduct={onDeduct}
                    onBilling={onBilling}
                    onRevoke={onRevoke}
                    onDelete={onDelete}
                    onUserDetails={onUserDetails}
                    onViewSubscription={onViewSubscription}
                    onServiceAssignment={onServiceAssignment}
                    onAwardCredits={onAwardCredits}
                    onToggleHide={onToggleHide}
                    getSubscription={getSubscription}
                    isSubscriptionLoading={isSubscriptionLoading}
                    userRole={userRole}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});