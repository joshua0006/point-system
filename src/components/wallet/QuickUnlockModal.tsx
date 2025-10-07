import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, CreditCard, AlertCircle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface QuickUnlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lockedBalance: number;
  currentBalance: number;
}

export const QuickUnlockModal = ({ 
  open, 
  onOpenChange, 
  lockedBalance,
  currentBalance 
}: QuickUnlockModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();
  
  // Default payment is 2X locked balance
  const defaultPayment = lockedBalance * 2;
  const [paymentAmount, setPaymentAmount] = useState(defaultPayment.toFixed(2));
  
  // Calculate credits to unlock and validation
  const calculation = useMemo(() => {
    const payment = parseFloat(paymentAmount) || 0;
    const creditsToUnlock = Math.floor(payment / 2 * 10) / 10; // Round to 1 decimal
    const maxPayment = lockedBalance * 2;
    const minPayment = 0.2; // Minimum to unlock 0.1 FXC
    
    const isValid = payment >= minPayment && payment <= maxPayment && creditsToUnlock <= lockedBalance;
    const remainingLocked = Math.max(0, lockedBalance - creditsToUnlock);
    const newBalance = currentBalance + creditsToUnlock + payment; // $1 = 1 FXC
    
    let error = '';
    if (payment < minPayment) error = 'Minimum payment is $0.20';
    else if (payment > maxPayment) error = `Maximum payment is $${maxPayment.toFixed(2)}`;
    else if (creditsToUnlock > lockedBalance) error = 'Cannot unlock more than locked balance';
    
    return { creditsToUnlock, isValid, remainingLocked, newBalance, error };
  }, [paymentAmount, lockedBalance, currentBalance]);

  const handleQuickUnlock = async () => {
    if (!calculation.isValid) {
      toast.error("Invalid payment amount", {
        description: calculation.error
      });
      return;
    }

    try {
      setIsProcessing(true);

      const payment = parseFloat(paymentAmount);

      // Create Stripe checkout session for unlocking credits
      const { data, error } = await supabase.functions.invoke('create-unlock-checkout', {
        body: {
          paymentAmount: payment,
          creditsToUnlock: calculation.creditsToUnlock,
          lockedBalance
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
      
    } catch (error: any) {
      console.error('Quick unlock error:', error);
      toast.error("Failed to create checkout session", {
        description: error.message
      });
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            Quick Unlock Awarded Credits
          </DialogTitle>
          <DialogDescription>
            Pay to instantly unlock your awarded flexi-credits
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Pay $2 for every $1 of locked credits. You can unlock all or just a portion.
            </AlertDescription>
          </Alert>

          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Locked Credits:</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                {lockedBalance.toFixed(1)} FXC
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-amount">Payment Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="payment-amount"
                type="number"
                step="0.10"
                min="0.20"
                max={lockedBalance * 2}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="pl-7"
                disabled={isProcessing}
              />
            </div>
            {calculation.error && (
              <p className="text-sm text-destructive">{calculation.error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Default: ${defaultPayment.toFixed(2)} (unlocks all {lockedBalance.toFixed(1)} FXC)
            </p>
          </div>

          <div className="space-y-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Credits to Unlock:</span>
              <span className="font-bold text-primary">
                {calculation.creditsToUnlock.toFixed(1)} FXC
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Payment Credits:</span>
              <span className="font-medium">
                +{(parseFloat(paymentAmount || "0")).toFixed(1)} FXC
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Remaining Locked:</span>
              <span className="font-medium text-orange-600 dark:text-orange-400">
                {calculation.remainingLocked.toFixed(1)} FXC
              </span>
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Balance:</span>
                <span className="font-medium">{currentBalance.toFixed(1)} FXC</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-medium">New Balance:</span>
                <span className="font-bold text-primary">
                  {calculation.newBalance.toFixed(1)} FXC
                </span>
              </div>
            </div>
          </div>

          <Alert className="bg-primary/5 border-primary/20">
            <CreditCard className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              You will be redirected to Stripe to complete the payment
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleQuickUnlock}
            disabled={isProcessing || lockedBalance === 0 || !calculation.isValid}
          >
            {isProcessing ? "Redirecting to Stripe..." : `Pay $${parseFloat(paymentAmount || "0").toFixed(2)} & Unlock ${calculation.creditsToUnlock.toFixed(1)} FXC`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
