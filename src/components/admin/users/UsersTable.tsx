import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw } from "lucide-react";
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
  getSubscription: (userId: string) => any;
  isSubscriptionLoading: (userId: string) => boolean;
  userRole: string;
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
  getSubscription,
  isSubscriptionLoading,
  userRole
}: UsersTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>User Management</CardTitle>
          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
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