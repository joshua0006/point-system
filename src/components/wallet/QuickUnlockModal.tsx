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
  
  const requiredPayment = 10; // Fixed $10 payment

  const handleQuickUnlock = async () => {
    try {
      setIsProcessing(true);

      // Create Stripe checkout session for unlocking credits
      const { data, error } = await supabase.functions.invoke('create-unlock-checkout', {
        body: {
          amount: requiredPayment,
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
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              To unlock your awarded credits, you need to make a $10 payment via Stripe.
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
              <span className="font-semibold">${requiredPayment}</span>
            </div>

            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Balance:</span>
                <span className="font-medium">{currentBalance} FXC</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-medium">New Balance After Unlock:</span>
                <span className="font-bold text-primary">
                  {currentBalance + lockedBalance + requiredPayment * 100} FXC
                </span>
              </div>
            </div>
          </div>

          <Alert className="bg-primary/5 border-primary/20">
            <CreditCard className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              You will be redirected to Stripe to complete the ${requiredPayment} payment
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
            {isProcessing ? "Redirecting to Stripe..." : `Pay $${requiredPayment} & Unlock ${lockedBalance.toFixed(1)} FXC`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
