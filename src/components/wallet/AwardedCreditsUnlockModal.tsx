import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Lock, Unlock, AlertTriangle } from "lucide-react";
import { useUnlockAwardedCredits } from "@/hooks/useUnlockAwardedCredits";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";

interface AwardedCreditsUnlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topupTransactionId: string;
  topupAmount: number;
  lockedBalance: number;
  maxUnlock: number;
  expiringCredits?: Array<{
    amount: number;
    expires_at: string;
    days_until_expiry: number;
  }>;
  currentBalance: number;
}

export function AwardedCreditsUnlockModal({
  open,
  onOpenChange,
  topupTransactionId,
  topupAmount,
  lockedBalance,
  maxUnlock,
  expiringCredits = [],
  currentBalance
}: AwardedCreditsUnlockModalProps) {
  const [amountToUnlock, setAmountToUnlock] = useState(maxUnlock);
  const { mutate: unlockCredits, isPending } = useUnlockAwardedCredits();
  const isMobile = useIsMobile();

  const handleUnlock = () => {
    unlockCredits(
      { topupTransactionId, amountToUnlock },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        onError: () => {
          onOpenChange(false);
        }
      }
    );
  };

  const newBalance = currentBalance + amountToUnlock;
  const remainingLocked = lockedBalance - amountToUnlock;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isMobile ? "max-w-[95vw] max-h-[90vh] p-3 overflow-y-auto" : "sm:max-w-md max-h-[90vh] overflow-y-auto"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Unlock className="h-5 w-5 text-primary" />
            Unlock Awarded Flexi Credits
          </DialogTitle>
          <DialogDescription>
            You've topped up ${topupAmount}. You can now unlock your awarded credits!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Top-up Info */}
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Top-up Amount</span>
              <span className="font-medium">${topupAmount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Locked Awarded FXC Available</span>
              <span className="font-medium text-orange-600">{lockedBalance} FXC</span>
            </div>
          </div>

          {/* Expiring Credits Warning */}
          {expiringCredits.length > 0 && (
            <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                {expiringCredits[0].amount} FXC expires in {expiringCredits[0].days_until_expiry} days!
              </AlertDescription>
            </Alert>
          )}

          {/* Unlock Amount Selector */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Amount to Unlock</label>
              <span className="text-2xl font-bold text-primary">{amountToUnlock} FXC</span>
            </div>

            <Slider
              value={[amountToUnlock]}
              onValueChange={([value]) => setAmountToUnlock(value)}
              max={maxUnlock}
              min={0}
              step={1}
              className="w-full"
              disabled={isPending}
            />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 FXC</span>
              <span>Max: {maxUnlock} FXC</span>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="text-sm font-medium mb-2">After Unlock Preview:</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Balance</span>
                <span className="font-medium">{currentBalance} FXC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">+ Amount to Unlock</span>
                <span className="font-medium text-green-600">+{amountToUnlock} FXC</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>New Balance</span>
                <span className="text-primary">{newBalance} FXC</span>
              </div>
              <div className="flex justify-between mt-2 pt-2 border-t">
                <span className="text-muted-foreground">Remaining Locked</span>
                <span className="font-medium text-orange-600">{remainingLocked} FXC</span>
              </div>
            </div>
          </div>

          {/* Info Text */}
          <p className="text-xs text-muted-foreground text-center">
            You need to top-up $2 to unlock $1 of awarded flexi credits (2:1 ratio)
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isPending}
            >
              Skip for Now
            </Button>
            <Button
              onClick={handleUnlock}
              className={isMobile ? "flex-1 text-xs" : "flex-1"}
              disabled={isPending || amountToUnlock === 0}
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  {isMobile ? "..." : "Unlocking..."}
                </div>
              ) : (
                isMobile ? `Unlock ${amountToUnlock} FXC` : `Unlock ${amountToUnlock} FXC`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}