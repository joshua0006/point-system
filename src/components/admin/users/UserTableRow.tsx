import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TableCell, TableRow } from "@/components/ui/table";
import { Plus, Minus, Receipt, UserX, Trash2 } from "lucide-react";
import type { UserProfile } from "@/config/types";

interface UserTableRowProps {
  user: UserProfile;
  onTopUp: (user: UserProfile) => void;
  onDeduct: (user: UserProfile) => void;
  onBilling: (user: UserProfile) => void;
  onRevoke: (user: UserProfile) => void;
  onDelete: (user: UserProfile) => void;
  onUserDetails: (user: UserProfile) => void;
  onViewSubscription: (user: UserProfile) => void;
  getSubscription: (userId: string) => any;
  isSubscriptionLoading: (userId: string) => boolean;
  userRole: string;
}

export const UserTableRow = memo(function UserTableRow({
  user,
  onTopUp,
  onDeduct,
  onBilling,
  onRevoke,
  onDelete,
  onUserDetails,
  onViewSubscription,
  getSubscription,
  isSubscriptionLoading,
  userRole
}: UserTableRowProps) {
  const subscription = getSubscription(user.user_id);
  const loading = isSubscriptionLoading(user.user_id);

  const renderSubscriptionBadge = () => {
    const badgeClass = "min-w-[120px] justify-center";
    // Only show loading when we truly have no data yet
    if (loading && !subscription) {
      return <Badge variant="outline" className={`animate-pulse ${badgeClass}`}>Loading...</Badge>;
    }

    if (!subscription || !subscription.isActive) {
      return <Badge variant="secondary" className={badgeClass}>No Active Plan</Badge>;
    }

    return <Badge variant="default" className={badgeClass}>{subscription.planName || 'Premium Plan'}</Badge>;
  };

  const canDelete = (userRole === 'master_admin' && user.role !== 'master_admin') || 
    (userRole === 'admin' && user.role !== 'admin' && user.role !== 'master_admin');

  return (
    <TableRow>
      <TableCell>
        <div 
          className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors" 
          onClick={() => onUserDetails(user)}
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback>
              {(user.full_name || user.email).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">
              {user.full_name || "No name"}
            </div>
            <div className="text-sm text-muted-foreground">
              {user.email}
            </div>
          </div>
        </div>
      </TableCell>
      
      <TableCell>
        <Badge variant={
          user.role === 'master_admin' ? 'destructive' :
          user.role === 'admin' ? 'destructive' :
          user.role === 'consultant' ? 'default' : 'secondary'
        }>
          {user.role === 'master_admin' ? 'Master Admin' : user.role}
        </Badge>
      </TableCell>
      
      <TableCell>
        <Badge variant={
          user.approval_status === 'approved' ? 'default' :
          user.approval_status === 'pending' ? 'secondary' : 'destructive'
        }>
          {user.approval_status || 'approved'}
        </Badge>
      </TableCell>
      
      <TableCell>
        <div className="font-medium text-accent">
          {(user.flexi_credits_balance || 0).toLocaleString()} flexi credits
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center justify-between gap-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <div className="text-muted-foreground">Current Balance:</div>
            <div className="font-semibold text-primary">
              {(user.flexi_credits_balance || 0).toLocaleString()} credits
            </div>

            <div className="text-muted-foreground">Plan:</div>
            <div className="font-semibold">
              {loading && !subscription
                ? 'Loading...'
                : (subscription?.planName ? `${subscription.planName}` : 'No Plan')}
            </div>

            <div className="text-muted-foreground">Monthly Credits:</div>
            <div className="font-semibold">
              {loading && !subscription
                ? 'Loading...'
                : (subscription?.isActive ? (subscription?.creditsPerMonth ?? 0) : 0)}
            </div>

            <div className="text-muted-foreground">Next Billing:</div>
            <div className="font-semibold">
              {loading && !subscription
                ? 'Loading...'
                : (subscription?.isActive && subscription?.endDate
                  ? new Date(subscription.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                  : '—')}
            </div>
          </div>
          <div className="shrink-0">
            <Button
              onClick={() => onViewSubscription(user)}
              size="sm"
              variant="outline"
              className="h-7 px-2"
              aria-label="View subscription details"
            >
              View Sub
            </Button>
          </div>
        </div>
      </TableCell>
      
      <TableCell>
        <div className="text-sm text-muted-foreground">
          {new Date(user.created_at).toLocaleDateString()}
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={() => onTopUp(user)} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
          
          <Button
            onClick={() => onDeduct(user)}
            size="sm"
            variant="outline"
            disabled={(user.flexi_credits_balance || 0) <= -500}
          >
            <Minus className="w-4 h-4 mr-1" />
            Deduct
          </Button>
          
          {user.approval_status === 'approved' && user.role !== 'admin' && user.role !== 'master_admin' && (
            <Button onClick={() => onRevoke(user)} size="sm" variant="destructive">
              <UserX className="w-4 h-4 mr-1" />
              Revoke
            </Button>
          )}
          
          <Button onClick={() => onBilling(user)} size="sm" variant="outline">
            <Receipt className="w-4 h-4 mr-1" />
            Billing
          </Button>
          
          {canDelete && (
            <Button onClick={() => onDelete(user)} size="sm" variant="destructive">
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});