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

  const handleSubscribe = async (credits: number, price: number) => {
    setSelectedAmount(credits);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: { credits, price }
      });
      
      if (error) throw error;
      
      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      
      // Close the modal
      onClose();
    } catch (error: any) {
      console.error('Error creating subscription checkout:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription checkout",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      // Open Stripe customer portal in a new tab
      window.open(data.url, '_blank');
      
      // Close the modal
      onClose();
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal",
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
          <DialogTitle className="text-2xl font-bold">Manage Your Subscription</DialogTitle>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-muted-foreground">Current Balance:</span>
            <span className="font-semibold text-primary">
              {profile?.flexi_credits_balance?.toLocaleString() || '0'} flexi-credits
            </span>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Subscription Status */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 border-2 border-primary/20">
            <div className="text-center mb-4">
              <h3 className="font-bold text-xl text-primary mb-2">📅 Current Subscription</h3>
              <p className="text-sm text-muted-foreground">
                Your subscription renews on the 1st of each month
              </p>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold mb-2">
                Current Plan: <span className="text-primary">Starter Plan</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Next billing: 1st January 2025 • Change takes effect next billing cycle
              </p>
              <Button
                onClick={handleManageSubscription}
                disabled={loading}
                variant="outline"
                className="mx-auto"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    Loading...
                  </div>
                ) : (
                  "Manage Subscription & Billing"
                )}
              </Button>
            </div>
          </div>

          {/* Subscription Plans Grid */}
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
                    Most Popular
                  </Badge>
                )}
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-lg mb-2">{pkg.title}</h3>
                  <div className="mb-4">
                    <div className="text-3xl font-bold">
                      S${pkg.price}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      per month
                    </div>
                    <div className="text-sm font-medium text-primary">
                      {pkg.points} flexi-credits/month
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
                    onClick={() => handleSubscribe(pkg.points, pkg.price)}
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
                      "Subscribe to Plan"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Custom Plan Section */}
          <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg p-6 border-2 border-dashed border-primary/30">
            <h3 className="font-bold text-xl text-primary mb-4 text-center">💎 Custom Plan</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Need a specific amount? Create your own custom subscription plan
            </p>
            <div className="max-w-md mx-auto space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Flexi-Credits per month</label>
                <Input
                  type="number"
                  placeholder="Enter credits amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  min="1"
                  max="10000"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 1 credit, maximum 10,000 credits
                </p>
              </div>
              {customAmount && parseInt(customAmount) > 0 && (
                <div className="bg-background/50 rounded-lg p-3 border">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      S${parseInt(customAmount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      per month for {customAmount} flexi-credits
                    </div>
                  </div>
                </div>
              )}
              <Button
                onClick={() => customAmount && handleSubscribe(parseInt(customAmount), parseInt(customAmount))}
                disabled={loading || !customAmount || parseInt(customAmount) <= 0}
                className="w-full"
                variant="outline"
              >
                {loading && selectedAmount === parseInt(customAmount) ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  "Create Custom Plan"
                )}
              </Button>
            </div>
          </div>

          {/* Billing Information */}
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <h4 className="font-semibold text-primary mb-2">💡 Subscription Details</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• All subscriptions are billed monthly on the 1st</p>
              <p>• Plan changes take effect from your next billing cycle</p>
              <p>• Unused flexi-credits roll over to the next month</p>
              <p>• Cancel anytime - your plan remains active until the end of your billing period</p>
            </div>
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