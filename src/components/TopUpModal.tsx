import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, CreditCard, Zap, Star, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (amount?: number, showSuccessModal?: boolean) => void;
}

export const TopUpModal = ({ isOpen, onClose, onSuccess }: TopUpModalProps) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>("");
  const { toast } = useToast();
  const { profile } = useAuth();

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
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-points-checkout', {
        body: { points: amount }
      });
      
      if (error) throw error;
      
      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      
      // Close the modal
      onClose();
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

          {/* Custom Amount Section */}
          <div className="bg-muted/30 rounded-lg p-6 border border-muted">
            <h3 className="font-semibold text-lg mb-4 text-center">Custom Amount</h3>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Enter custom amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  min="1"
                  className="text-center"
                />
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  Minimum: S$1 (1 point)
                </p>
              </div>
              <Button
                onClick={() => {
                  const amount = parseInt(customAmount);
                  if (amount >= 1) {
                    handleAddPoints(amount);
                  } else {
                    toast({
                      title: "Invalid Amount",
                      description: "Please enter a minimum amount of S$1",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={loading || !customAmount || parseInt(customAmount) < 1}
                className="w-full sm:w-auto"
              >
                {loading && selectedAmount === parseInt(customAmount) ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  "Add Custom Amount"
                )}
              </Button>
            </div>
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
    </Dialog>
  );
};