import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, CreditCard, Zap, Star, CheckCircle } from "lucide-react";
import { AddPaymentMethodModal } from "@/components/settings/AddPaymentMethodModal";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (amount?: number, showSuccessModal?: boolean) => void;
}

export const TopUpModal = ({ isOpen, onClose, onSuccess }: TopUpModalProps) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();
  const { paymentMethods, instantCharge, fetchPaymentMethods } = usePaymentMethods();

  const pointsPackages = [
    { 
      points: 250, 
      price: 250, 
      popular: false, 
      title: "Starter",
      features: ["250 AI tokens", "Basic campaigns", "Email support"]
    },
    { 
      points: 500, 
      price: 500, 
      popular: true, 
      title: "Plus",
      features: ["500 AI tokens", "Advanced campaigns", "Priority support"]
    },
    { 
      points: 750, 
      price: 750, 
      popular: false, 
      title: "Pro",
      features: ["750 AI tokens", "Premium features", "Dedicated support"]
    },
    { 
      points: 1000, 
      price: 1000, 
      popular: false, 
      title: "Ultra",
      features: ["1000 AI tokens", "All features", "24/7 support"]
    },
  ];

  const handleAddPoints = async (amount: number) => {
    setSelectedAmount(amount);
    setPendingAmount(amount);
    
    // Check if user has any payment methods
    if (paymentMethods.length === 0) {
      // No payment methods - show add payment method modal first
      setShowAddMethodModal(true);
    } else {
      // Has payment methods - proceed with instant charge
      const defaultPaymentMethod = paymentMethods.find(method => method.is_default) || paymentMethods[0];
      await executeInstantCharge(defaultPaymentMethod.id, amount);
    }
  };

  const executeInstantCharge = async (paymentMethodId: string, amount: number) => {
    setLoading(true);
    try {
      await instantCharge(paymentMethodId, amount);
      toast({
        title: "Success!",
        description: `Successfully added ${amount} points to your account`,
      });
      onClose();
      onSuccess?.(amount, true);
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodAdded = async () => {
    setShowAddMethodModal(false);
    
    // If there's a pending amount, charge it now
    if (pendingAmount) {
      toast({
        title: "Payment Method Added!",
        description: `Processing payment of S$${pendingAmount} now...`,
      });
      
      // Small delay to ensure payment methods are refreshed, then charge
      setTimeout(() => {
        fetchPaymentMethods(true).then(() => {
          // The payment methods should now include the newly added one
          // We'll just use the first available method since it was just added
          if (paymentMethods.length > 0) {
            const paymentMethod = paymentMethods[0]; // Use the first (likely newest) method
            executeInstantCharge(paymentMethod.id, pendingAmount);
          }
        });
        setPendingAmount(null);
      }, 1000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-6">
          <DialogTitle className="text-2xl font-bold">Add Points to Your Account</DialogTitle>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-muted-foreground">Current Balance:</span>
            <span className="font-semibold text-primary">
              {profile?.points_balance?.toLocaleString() || '0'} points
            </span>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Monthly/Yearly Toggle */}
          <div className="flex justify-center">
            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button variant="default" size="sm" className="rounded-md">
                One-time
              </Button>
            </div>
          </div>

          {/* Points Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pointsPackages.map((pkg) => (
              <Card 
                key={pkg.points} 
                className={`relative border-2 transition-all hover:shadow-lg ${
                  pkg.popular 
                    ? 'border-primary shadow-lg scale-105' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                    Popular
                  </Badge>
                )}
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-lg mb-2">{pkg.title}</h3>
                  <div className="mb-4">
                    <div className="text-3xl font-bold">
                      S${pkg.price}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {pkg.points} points
                    </div>
                  </div>
                  
                  <ul className="space-y-2 text-sm text-left mb-6">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    onClick={() => handleAddPoints(pkg.points)}
                    disabled={loading}
                    className={`w-full ${
                      pkg.popular 
                        ? 'bg-primary hover:bg-primary/90' 
                        : ''
                    }`}
                    variant={pkg.popular ? "default" : "outline"}
                  >
                    {loading && selectedAmount === pkg.points ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      "Add Points"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Information Section */}
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <h4 className="font-semibold text-primary mb-2">What are points?</h4>
            <p className="text-sm text-muted-foreground">
              Points are units used for AI token credits in your campaigns. Your plan includes credits to 
              spend on various AI models - the more complex the task, the more points used.
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-6 py-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-green-600" />
              SSL Secured
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4 text-blue-600" />
              PCI Compliant
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-yellow-600" />
              Instant Processing
            </div>
          </div>
        </div>
      </DialogContent>

      <AddPaymentMethodModal
        open={showAddMethodModal}
        onOpenChange={setShowAddMethodModal}
        onSuccess={handlePaymentMethodAdded}
      />
    </Dialog>
  );
};