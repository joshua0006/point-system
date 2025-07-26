import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, CreditCard, Zap, Clock, ArrowRight, Star, CheckCircle, Plus, ChevronDown, Wallet, AlertCircle } from "lucide-react";
import { AddPaymentMethodModal } from "@/components/settings/AddPaymentMethodModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (amount?: number, showSuccessModal?: boolean) => void;
}

export const TopUpModal = ({ isOpen, onClose, onSuccess }: TopUpModalProps) => {
  const [customAmount, setCustomAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    amount: number;
    paymentMethod?: string;
    isInstant: boolean;
  } | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();
  const { paymentMethods, loading: paymentMethodsLoading, instantCharge, fetchPaymentMethods } = usePaymentMethods();

  // Auto-select default payment method when available
  const defaultPaymentMethod = paymentMethods.find(method => method.is_default) || paymentMethods[0];
  
  // Set selected payment method to default when payment methods are loaded
  useEffect(() => {
    if (defaultPaymentMethod && !selectedPaymentMethod) {
      setSelectedPaymentMethod(defaultPaymentMethod.id);
    }
  }, [defaultPaymentMethod?.id, selectedPaymentMethod]);

  const quickPackages = [
    { points: 250, price: 250, popular: false },
    { points: 500, price: 500, popular: true },
    { points: 750, price: 750, popular: false },
    { points: 1000, price: 1000, popular: false },
  ];

  const showConfirmationDialog = (amount: number, paymentMethodId?: string, isInstant = false) => {
    if (!amount || amount < 250) {
      toast({
        title: "Invalid Amount",
        description: "Minimum amount is 250 points (S$250)",
        variant: "destructive",
      });
      return;
    }

    setConfirmationData({
      amount,
      paymentMethod: paymentMethodId,
      isInstant
    });
    setShowConfirmDialog(true);
  };

  const handleConfirmedPayment = async () => {
    if (!confirmationData) return;

    const { amount, paymentMethod, isInstant } = confirmationData;
    setShowConfirmDialog(false);
    setConfirmationData(null);

    if (isInstant && paymentMethod) {
      await executeInstantCharge(paymentMethod, amount);
    } else {
      await executeTopUp(amount);
    }
  };

  const executeTopUp = async (amount: number) => {
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

  const executeInstantCharge = async (paymentMethodId: string, amount: number) => {
    try {
      await instantCharge(paymentMethodId, amount);
      onClose();
      setCustomAmount("");
      setSelectedPaymentMethod("");
      // Refresh payment methods to update any changes
      fetchPaymentMethods();
      // Trigger dashboard data refresh and show success modal
      onSuccess?.(amount, true);
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
          {/* Primary: Instant Payment with Saved Methods */}
          {paymentMethods.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Instant Payment</h3>
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                  <Zap className="h-3 w-3 mr-1" />
                  Instant • No Redirects
                </Badge>
              </div>
              
              {/* Default Payment Method Card */}
              {defaultPaymentMethod && (
                <Card className="border-2 border-green-200 bg-green-50/50 hover:border-green-300 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-6 bg-gradient-to-r from-green-600 to-green-700 rounded flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium capitalize flex items-center gap-2">
                            {defaultPaymentMethod.brand} •••• {defaultPaymentMethod.last4}
                            {defaultPaymentMethod.is_default && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                                Default
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Expires {defaultPaymentMethod.exp_month}/{defaultPaymentMethod.exp_year}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-green-700 font-medium mb-1">⚡ AUTO-SELECTED</div>
                        <div className="text-xs text-muted-foreground">Instant processing</div>
                      </div>
                    </div>
                    
                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                      {quickPackages.map((pkg) => (
                        <Button
                          key={pkg.points}
                          variant={pkg.popular ? "default" : "outline"}
                          className={`h-12 flex-col gap-1 text-xs ${pkg.popular ? 'bg-primary' : ''}`}
                          onClick={() => showConfirmationDialog(pkg.points, defaultPaymentMethod.id, true)}
                          disabled={loading || paymentMethodsLoading}
                        >
                          <div className="font-bold">{pkg.points}</div>
                          <div className="text-xs opacity-75">S${pkg.points}</div>
                          {pkg.popular && <Star className="h-2 w-2" />}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Other Payment Methods (Collapsed) */}
              {paymentMethods.length > 1 && (
                <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                    Use different payment method ({paymentMethods.length - 1} available)
                  </summary>
                  <div className="mt-3 space-y-2">
                    {paymentMethods.filter(method => method.id !== defaultPaymentMethod?.id).map((method) => (
                      <Card key={method.id} className="border border-border/60 hover:border-primary/30 transition-colors">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center">
                                <CreditCard className="h-3 w-3 text-white" />
                              </div>
                              <div>
                                <div className="font-medium capitalize text-sm">
                                  {method.brand} •••• {method.last4}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Expires {method.exp_month}/{method.exp_year}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {quickPackages.slice(0, 2).map((pkg) => (
                                <Button
                                  key={pkg.points}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs px-2 py-1 h-6"
                                  onClick={() => showConfirmationDialog(pkg.points, method.id, true)}
                                  disabled={loading || paymentMethodsLoading}
                                >
                                  S${pkg.points}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </details>
              )}
              
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
            <div className="text-lg font-semibold text-primary">1 Point = S$1.00 SGD</div>
            <p className="text-sm text-muted-foreground mt-1">
              Points are used to participate in lead generation campaigns
            </p>
          </div>

          {/* Secondary: Add New Payment Method (only show if no saved methods OR as alternative) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">
                {paymentMethods.length > 0 ? "Add New Payment Method" : "Payment Options"}
              </h3>
              {paymentMethods.length === 0 && (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Star className="h-3 w-3 mr-1" />
                  Secure Checkout
                </Badge>
              )}
              {paymentMethods.length > 0 && (
                <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
                  <Plus className="h-3 w-3 mr-1" />
                  Save for Future
                </Badge>
              )}
            </div>
            
            {paymentMethods.length > 0 && (
              <div className="p-3 bg-orange-50/50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-orange-800">
                  <AlertCircle className="h-4 w-4" />
                  <span>Takes 2-3 minutes • Will save this method for instant future payments</span>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              {quickPackages.map((pkg) => (
                <Card
                  key={pkg.points}
                  className={`relative cursor-pointer border transition-all hover:shadow-md ${
                    pkg.popular 
                      ? 'border-primary/50 bg-primary/5' 
                      : 'border-border hover:border-primary/30'
                  }`}
                  onClick={() => showConfirmationDialog(pkg.points)}
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
                    <div className="text-xl font-semibold">S${pkg.price}</div>
                    <div className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" />
                      {paymentMethods.length > 0 ? '2-3 minutes' : 'Secure checkout'}
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
                  placeholder="Minimum 250 points (S$250)"
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

              {/* Auto-selected Default Payment Method for Custom Amount */}
              {paymentMethods.length > 0 && customAmount && parseInt(customAmount) >= 250 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Payment Method (Auto-Selected)</Label>
                  <div className="h-12 bg-green-50 border border-green-200 rounded-md flex items-center px-3">
                    <div className="flex items-center gap-2 text-green-800">
                      <Zap className="h-4 w-4" />
                      <CreditCard className="h-4 w-4" />
                      <span className="font-medium">
                        {defaultPaymentMethod?.brand} •••• {defaultPaymentMethod?.last4}
                      </span>
                      {defaultPaymentMethod?.is_default && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>
                  <details className="group">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1">
                      <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                      Use different payment method
                    </summary>
                    <div className="mt-2">
                      <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.id} value={method.id}>
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                {method.brand} •••• {method.last4}
                                {method.is_default && (
                                  <Badge variant="secondary" className="ml-2">Default</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </details>
                </div>
              )}
              
              {customAmount && parseInt(customAmount) >= 250 && (
                <div className="p-4 bg-secondary/30 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Amount:</span>
                    <span className="font-bold text-xl text-primary">
                      S${parseInt(customAmount).toLocaleString()}
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
              
              <div className="flex gap-2">
                {/* Primary: Instant Charge Button (when saved methods exist) */}
                {paymentMethods.length > 0 && (
                  <Button 
                    onClick={() => showConfirmationDialog(parseInt(customAmount), selectedPaymentMethod || defaultPaymentMethod?.id, true)}
                    disabled={loading || !customAmount || parseInt(customAmount) < 250}
                    className="flex-1 h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                    size="lg"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Instant Charge
                      </div>
                    )}
                  </Button>
                )}

                {/* Secondary: Add New Payment Method Button */}
                <Button 
                  onClick={() => showConfirmationDialog(parseInt(customAmount))}
                  disabled={loading || !customAmount || parseInt(customAmount) < 250}
                  className={`h-12 text-lg font-semibold ${
                    paymentMethods.length > 0 
                      ? 'flex-1 variant-outline bg-background hover:bg-muted border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 text-foreground' 
                      : 'w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground'
                  }`}
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {paymentMethods.length > 0 ? (
                        <>
                          <Plus className="w-5 h-5" />
                          Add & Pay
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          Secure Checkout
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </div>
                  )}
                </Button>
              </div>
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

      <AddPaymentMethodModal
        open={showAddMethodModal}
        onOpenChange={setShowAddMethodModal}
        onSuccess={() => {
          fetchPaymentMethods();
          setShowAddMethodModal(false);
        }}
      />

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Confirm Points Purchase
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Points to add:</span>
                  <span className="text-xl font-bold text-primary">
                    +{confirmationData?.amount.toLocaleString()} points
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Total cost:</span>
                  <span className="text-lg font-semibold text-foreground">
                    S${confirmationData?.amount.toLocaleString()}
                  </span>
                </div>
                <Separator className="my-3" />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current wallet balance:</span>
                    <span className="font-medium text-foreground">
                      {profile?.points_balance?.toLocaleString() || '0'} points
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">New wallet balance:</span>
                    <span className="text-lg font-bold text-primary">
                      {((profile?.points_balance || 0) + (confirmationData?.amount || 0)).toLocaleString()} points
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  These points will be {confirmationData?.isInstant ? 'instantly added' : 'added after payment completion'} to your wallet and can be used for lead generation campaigns.
                </div>
              </div>

              {confirmationData?.isInstant && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded border border-green-200">
                  <Zap className="h-4 w-4" />
                  <span>Instant charge using saved payment method</span>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedPayment} className="bg-primary hover:bg-primary/90">
              {confirmationData?.isInstant ? 'Charge Now' : 'Proceed to Checkout'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};