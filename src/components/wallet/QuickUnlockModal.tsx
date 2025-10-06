import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, CreditCard, AlertCircle } from "lucide-react";
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
  
  const requiredPayment = Math.ceil(lockedBalance * 2);

  const handleQuickUnlock = async () => {
    try {
      setIsProcessing(true);

      // Get user's default payment method
      const { data: paymentMethods, error: pmError } = await supabase.functions.invoke('list-payment-methods');
      
      if (pmError) throw pmError;
      if (!paymentMethods?.data?.length) {
        toast.error("No payment method found", {
          description: "Please add a payment method first"
        });
        return;
      }

      const defaultPM = paymentMethods.data.find((pm: any) => pm.is_default) || paymentMethods.data[0];

      // Process instant charge
      const { data: chargeData, error: chargeError } = await supabase.functions.invoke('instant-charge', {
        body: {
          payment_method_id: defaultPM.stripe_payment_method_id,
          amount: requiredPayment
        }
      });

      if (chargeError) throw chargeError;
      if (chargeData.error) throw new Error(chargeData.error);

      // Get the transaction ID from the charge
      const topupTransactionId = chargeData.transaction_id;

      // Now unlock the credits
      const { data: unlockData, error: unlockError } = await supabase.functions.invoke('unlock-awarded-credits', {
        body: {
          topupTransactionId,
          amountToUnlock: lockedBalance
        }
      });

      if (unlockError) throw unlockError;
      if (unlockData.error) throw new Error(unlockData.error);

      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['awarded-credits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['flexi-credits-transactions'] });

      toast.success("Credits unlocked successfully!", {
        description: `${lockedBalance} FXC added to your balance`
      });

      onOpenChange(false);
      
    } catch (error: any) {
      console.error('Quick unlock error:', error);
      toast.error("Failed to unlock credits", {
        description: error.message
      });
    } finally {
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
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              To unlock your awarded credits, you need to make a payment equal to 2X the locked amount.
            </AlertDescription>
          </Alert>

          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Locked Credits:</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                {lockedBalance.toFixed(1)} FXC
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Required Payment:</span>
              <span className="font-semibold">{requiredPayment} FXC</span>
            </div>

            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Balance:</span>
                <span className="font-medium">{currentBalance} FXC</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-medium">New Balance After Unlock:</span>
                <span className="font-bold text-primary">
                  {currentBalance + lockedBalance + requiredPayment} FXC
                </span>
              </div>
            </div>
          </div>

          <Alert className="bg-primary/5 border-primary/20">
            <CreditCard className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              Your default payment method will be charged ${(requiredPayment / 100).toFixed(2)}
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
            disabled={isProcessing || lockedBalance === 0}
          >
            {isProcessing ? "Processing..." : `Pay & Unlock ${lockedBalance.toFixed(1)} FXC`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
