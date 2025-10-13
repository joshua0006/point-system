import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  // Default payment is 2X locked balance
  const defaultPayment = lockedBalance * 2;
  const maxPayment = lockedBalance * 2;
  const [paymentAmount, setPaymentAmount] = useState(defaultPayment);

  // Calculate credits to unlock
  const calculation = useMemo(() => {
    const creditsToUnlock = Math.floor(paymentAmount / 2 * 10) / 10; // Round to 1 decimal
    const newBalance = currentBalance + creditsToUnlock + paymentAmount; // $1 = 1 FXC

    return { creditsToUnlock, newBalance };
  }, [paymentAmount, currentBalance]);

  const handleQuickUnlock = async () => {
    try {
      setIsProcessing(true);

      // Create Stripe checkout session for unlocking credits
      const { data, error } = await supabase.functions.invoke('create-unlock-checkout', {
        body: {
          paymentAmount: paymentAmount,
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
      <DialogContent className={isMobile ? "max-w-[95vw] max-h-[90vh] p-4 overflow-y-auto" : "sm:max-w-md max-h-[90vh] overflow-y-auto"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Unlock Awarded Credits
          </DialogTitle>
          <DialogDescription>
            Pay $2 for every $1 of locked credits
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-6">
          {/* Locked Balance */}
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">Locked Credits Available</p>
            <p className="text-4xl font-bold">{lockedBalance.toFixed(1)} FXC</p>
          </div>

          {/* Payment Amount Slider */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Payment Amount</span>
              <span className="text-2xl font-bold">${paymentAmount.toFixed(2)}</span>
            </div>

            <Slider
              value={[paymentAmount]}
              onValueChange={([value]) => setPaymentAmount(value)}
              max={maxPayment}
              min={0.2}
              step={0.1}
              className="w-full"
              disabled={isProcessing}
            />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$0.20</span>
              <span>${maxPayment.toFixed(2)}</span>
            </div>
          </div>

          {/* Calculation Summary */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex justify-between">
              <span className="text-sm">Credits to Unlock</span>
              <span className="font-medium">{calculation.creditsToUnlock.toFixed(1)} FXC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Payment Credits</span>
              <span className="font-medium">+{paymentAmount.toFixed(1)} FXC</span>
            </div>
            <div className="flex justify-between pt-3 border-t">
              <span className="font-medium">New Balance</span>
              <span className="text-lg font-bold">{calculation.newBalance.toFixed(1)} FXC</span>
            </div>
          </div>
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
            disabled={isProcessing || lockedBalance === 0}
          >
            {isProcessing ? "Processing..." : `Pay $${paymentAmount.toFixed(2)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
