import { memo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { UserProfile } from "@/config/types";

interface UserSubscriptionModalProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getSubscription: (userId: string) => any;
  isSubscriptionLoading: (userId: string) => boolean;
}

export const UserSubscriptionModal = memo(function UserSubscriptionModal({
  user,
  open,
  onOpenChange,
  getSubscription,
  isSubscriptionLoading
}: UserSubscriptionModalProps) {
  if (!user) return null;

  const subscription = getSubscription(user.user_id);
  const loading = isSubscriptionLoading(user.user_id);

  const renderSubscriptionField = (label: string, getValue: () => string | number) => (
    <div>
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <div className="text-lg font-semibold">
        {loading ? "●●●" : getValue()}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subscription Details</DialogTitle>
          <DialogDescription>
            Subscription information for {user.full_name || user.email}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {renderSubscriptionField("Status", () => {
              if (!subscription || !subscription.isActive) {
                return "Inactive";
              }
              return "Active";
            })}
            
            {renderSubscriptionField("Plan", () => {
              if (!subscription || !subscription.isActive) {
                return "No Plan";
              }
              return subscription.planName || "Premium Plan";
            })}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Current Balance</label>
              <div className="text-lg font-semibold text-accent">
                {(user.flexi_credits_balance || 0).toLocaleString()} flexi credits
              </div>
            </div>
            
            {renderSubscriptionField("Credits Per Month", () => {
              if (!subscription || !subscription.isActive) {
                return "0";
              }
              return subscription.creditsPerMonth || "0";
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});