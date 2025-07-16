import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Wallet, Shield, CheckCircle } from "lucide-react";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TopUpModal = ({ isOpen, onClose }: TopUpModalProps) => {
  const [points, setPoints] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const pointsPackages = [
    { points: 250, price: 250 },
    { points: 500, price: 500 },
    { points: 750, price: 750 },
    { points: 1000, price: 1000 },
  ];

  const handleTopUp = async (pointsAmount?: number) => {
    const finalPoints = pointsAmount || parseInt(points);
    if (!finalPoints || finalPoints < 1) {
      toast({
        title: "Invalid Amount",
        description: "Minimum top-up is 1 point ($1.00)",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-points-checkout', {
        body: { points: finalPoints }
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      onClose();
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center pb-6">
          <DialogTitle className="text-2xl font-bold flex items-center justify-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            Add Funds to Your Account
          </DialogTitle>
          <p className="text-muted-foreground mt-2">
            Secure payment processing powered by Stripe
          </p>
        </DialogHeader>
        
        <div className="space-y-8">
          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-6 py-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-green-600" />
              <span>256-bit SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>PCI Compliant</span>
            </div>
          </div>

          {/* Rate information */}
          <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="text-lg font-semibold text-primary">1 Point = $1.00 USD</div>
            <p className="text-sm text-muted-foreground mt-1">
              Use points to participate in lead generation campaigns
            </p>
          </div>

          {/* Preset packages */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Popular Packages</Label>
            <div className="grid grid-cols-2 gap-3">
              {pointsPackages.map((pkg) => (
                <Button
                  key={pkg.points}
                  variant="outline"
                  className="flex flex-col h-auto p-6 hover:border-primary hover:bg-primary/5 transition-colors"
                  onClick={() => handleTopUp(pkg.points)}
                  disabled={isLoading}
                >
                  <div className="text-lg font-bold text-primary">{pkg.points.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">POINTS</div>
                  <div className="text-lg font-semibold mt-2">${pkg.price}</div>
                </Button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Custom Amount</Label>
            <div className="space-y-3">
              <div className="relative">
                <Input
                  type="number"
                  placeholder="Enter amount (minimum $1)"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  min={1}
                  step={1}
                  className="pr-16 h-12 text-lg"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  POINTS
                </div>
              </div>
              
              {points && parseInt(points) >= 1 && (
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Amount:</span>
                    <span className="font-semibold text-lg">${parseInt(points).toFixed(2)}</span>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={() => handleTopUp()}
                disabled={isLoading || !points || parseInt(points) < 1}
                className="w-full h-12 text-lg font-semibold"
                size="lg"
              >
                {isLoading ? (
                  "Processing..."
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Proceed to Secure Checkout
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            Your payment is processed securely by Stripe. We do not store your payment information.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};