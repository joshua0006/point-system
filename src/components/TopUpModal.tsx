import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Wallet } from "lucide-react";

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Top Up Wallet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Add points to your wallet to participate in campaigns. Rate: 1 point = $1.00
          </div>

          {/* Preset packages */}
          <div className="space-y-3">
            <Label>Quick Top-up Packages</Label>
            <div className="grid grid-cols-2 gap-2">
              {pointsPackages.map((pkg) => (
                <Button
                  key={pkg.points}
                  variant="outline"
                  className="flex flex-col h-auto p-3"
                  onClick={() => handleTopUp(pkg.points)}
                  disabled={isLoading}
                >
                  <span className="font-semibold">{pkg.points.toLocaleString()} pts</span>
                  <span className="text-sm text-muted-foreground">${pkg.price}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div className="space-y-3">
            <Label>Custom Amount</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Enter points (min 1)"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                min={1}
                step={1}
              />
              <Button 
                onClick={() => handleTopUp()}
                disabled={isLoading || !points}
                className="flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Pay ${parseInt(points || "0").toFixed(2)}
              </Button>
            </div>
            {points && parseInt(points) >= 1 && (
              <div className="text-sm text-muted-foreground">
                Cost: ${parseInt(points).toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};