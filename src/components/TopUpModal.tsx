import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { Shield, CreditCard, Zap, Clock, ArrowRight, Star, CheckCircle, Plus } from "lucide-react";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TopUpModal = ({ isOpen, onClose }: TopUpModalProps) => {
  const [customAmount, setCustomAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { paymentMethods, loading: paymentMethodsLoading, instantCharge, fetchPaymentMethods } = usePaymentMethods();

  const quickPackages = [
    { points: 250, price: 250, popular: false },
    { points: 500, price: 500, popular: true },
    { points: 750, price: 750, popular: false },
    { points: 1000, price: 1000, popular: false },
  ];

  const handleTopUp = async (pointsAmount?: number) => {
    const amount = pointsAmount || parseInt(customAmount);
    
    if (!amount || amount < 250) {
      toast({
        title: "Invalid Amount",
        description: "Minimum top-up amount is 250 points ($250)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-points-checkout', {
        body: { points: amount },
      });

      if (error) throw error;

      if (data.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        onClose();
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInstantCharge = async (paymentMethodId: string, amount: number) => {
    try {
      await instantCharge(paymentMethodId, amount);
      onClose();
      // Refresh payment methods to update any changes
      fetchPaymentMethods();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold flex items-center justify-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            Add Points to Your Account
          </DialogTitle>
          <p className="text-muted-foreground mt-2">
            Secure and instant payment processing
          </p>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Saved Payment Methods */}
          {paymentMethods.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Quick Pay</h3>
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                  <Zap className="h-3 w-3 mr-1" />
                  Instant
                </Badge>
              </div>
              
              <div className="grid gap-3">
                {paymentMethods.map((method) => (
                  <Card key={method.id} className="border border-border/60 hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="font-medium capitalize">
                              {method.brand} •••• {method.last4}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Expires {method.exp_month}/{method.exp_year}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {quickPackages.map((pkg) => (
                            <Button
                              key={pkg.points}
                              size="sm"
                              variant="outline"
                              className="text-xs px-2 py-1 h-7"
                              onClick={() => handleInstantCharge(method.id, pkg.points)}
                              disabled={loading || paymentMethodsLoading}
                            >
                              ${pkg.points}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Separator className="my-6" />
            </div>
          )}

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

          {/* Rate Information */}
          <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="text-lg font-semibold text-primary">1 Point = $1.00 USD</div>
            <p className="text-sm text-muted-foreground mt-1">
              Points are used to participate in lead generation campaigns
            </p>
          </div>

          {/* Quick Packages */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">
                {paymentMethods.length > 0 ? "New Payment Method" : "Popular Packages"}
              </h3>
              {paymentMethods.length === 0 && (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Star className="h-3 w-3 mr-1" />
                  Best Value
                </Badge>
              )}
              {paymentMethods.length > 0 && (
                <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
                  <Plus className="h-3 w-3 mr-1" />
                  Add & Save
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {quickPackages.map((pkg) => (
                <Card
                  key={pkg.points}
                  className={`relative cursor-pointer border transition-all hover:shadow-md ${
                    pkg.popular 
                      ? 'border-primary/50 bg-primary/5' 
                      : 'border-border hover:border-primary/30'
                  }`}
                  onClick={() => handleTopUp(pkg.points)}
                >
                  {pkg.popular && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6 text-center">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {pkg.points.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mb-3">POINTS</div>
                    <div className="text-xl font-semibold">${pkg.price}</div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {paymentMethods.length > 0 ? 'Add to saved methods' : 'One-time purchase'}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Custom Amount</Label>
            <div className="space-y-3">
              <div className="relative">
                <Input
                  type="number"
                  placeholder="Minimum 250 points ($250)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  min={250}
                  step={50}
                  className="pr-20 h-12 text-lg"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                  POINTS
                </div>
              </div>
              
              {customAmount && parseInt(customAmount) >= 250 && (
                <div className="p-4 bg-secondary/30 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Amount:</span>
                    <span className="font-bold text-xl text-primary">
                      ${parseInt(customAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>Processing Fee: Included</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Instant delivery
                    </span>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={() => handleTopUp()}
                disabled={loading || !customAmount || parseInt(customAmount) < 250}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Proceed to Secure Checkout
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t bg-muted/20 -mx-6 px-6 py-4 rounded-b-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Secured by Stripe • Payment methods saved for future use</span>
            </div>
            <div>
              We don't store your payment information. All transactions are processed securely.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};