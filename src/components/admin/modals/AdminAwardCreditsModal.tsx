import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Gift } from '@/lib/icons';
import { useAdminAwardCredits } from "@/hooks/useAdminAwardCredits";

interface AdminAwardCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  userEmail: string;
  currentBalance: number;
  lockedBalance?: number;
}

export function AdminAwardCreditsModal({
  open,
  onOpenChange,
  userId,
  userName,
  userEmail,
  currentBalance,
  lockedBalance = 0
}: AdminAwardCreditsModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const { mutate: awardCredits, isPending } = useAdminAwardCredits();

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    
    if (!numAmount || numAmount <= 0) {
      return;
    }

    if (!reason.trim()) {
      return;
    }

    awardCredits(
      { userId, amount: numAmount, reason: reason.trim() },
      {
        onSuccess: () => {
          setAmount("");
          setReason("");
          onOpenChange(false);
        }
      }
    );
  };

  const numAmount = parseFloat(amount) || 0;
  const requiredTopup = numAmount * 2;
  const expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Award Flexi Credits
          </DialogTitle>
          <DialogDescription>
            Grant awarded flexi credits to {userName || userEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User:</span>
                <span className="font-medium">{userName || userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Balance:</span>
                <span className="font-medium">{currentBalance} FXC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Locked Awarded:</span>
                <span className="font-medium text-orange-600">{lockedBalance} FXC</span>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Award *</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              max="10000"
              step="1"
              placeholder="e.g., 100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Maximum: 10,000 FXC
            </p>
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Campaign performance bonus, Referral reward, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isPending}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/500 characters
            </p>
          </div>

          {/* Preview */}
          {numAmount > 0 && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="text-sm font-medium mb-2">Award Preview:</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount to Award</span>
                  <span className="font-semibold text-primary">{numAmount} FXC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User must top-up</span>
                  <span className="font-medium">${requiredTopup}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expiration Date</span>
                  <span className="font-medium">{expirationDate.toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> Awarded credits remain locked until the user tops up their account. 
              They must top-up $2 for every $1 of awarded credits they want to unlock. 
              Credits expire 1 year from the award date if not unlocked.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={isPending || !amount || numAmount <= 0 || !reason.trim()}
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  Awarding...
                </div>
              ) : (
                `Award ${numAmount || 0} FXC`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}