import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Plus, Trash2, Star, Loader2 } from "lucide-react";
import { AddPaymentMethodModal } from "./AddPaymentMethodModal";

export const PaymentMethodsTab = () => {
  const { paymentMethods, loading, fetchPaymentMethods, setupPaymentMethod } = usePaymentMethods();
  const { toast } = useToast();
  const [deleteMethod, setDeleteMethod] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    setIsDeleting(true);
    try {
      // Delete via edge function (handles both Stripe and Supabase)
      const { error } = await supabase.functions.invoke('delete-payment-method', {
        body: { payment_method_id: paymentMethodId }
      });

      if (error) throw error;

      toast({
        title: "Payment Method Removed",
        description: "Your payment method has been successfully removed.",
      });

      fetchPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast({
        title: "Error",
        description: "Failed to remove payment method. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteMethod(null);
    }
  };

  const handleAddPaymentMethod = () => {
    setShowAddModal(true);
  };

  const handlePaymentMethodSuccess = () => {
    fetchPaymentMethods();
    setShowAddModal(false);
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      // First, remove default from all methods
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .neq('stripe_payment_method_id', 'dummy');

      // Then set the selected method as default
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('stripe_payment_method_id', paymentMethodId);

      if (error) throw error;

      toast({
        title: "Default Payment Method Updated",
        description: "Your default payment method has been updated.",
      });

      fetchPaymentMethods();
    } catch (error) {
      console.error('Error setting default payment method:', error);
      toast({
        title: "Error",
        description: "Failed to update default payment method. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Payment Methods</span>
            <Button onClick={handleAddPaymentMethod} disabled={isAddingMethod}>
              {isAddingMethod ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add New Method
            </Button>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage your saved payment methods for quick purchases.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Payment Methods</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add a payment method to make quick purchases.
              </p>
              <Button onClick={handleAddPaymentMethod} disabled={isAddingMethod}>
                {isAddingMethod ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Your First Payment Method
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <Card key={method.id} className="border border-border/60">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">
                              {method.brand} •••• {method.last4}
                            </span>
                            {method.is_default && (
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                <Star className="h-3 w-3 mr-1" />
                                Default
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!method.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(method.id)}
                          >
                            Set as Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteMethod(method.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteMethod} onOpenChange={() => setDeleteMethod(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Payment Method</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this payment method? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMethod && handleDeletePaymentMethod(deleteMethod)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddPaymentMethodModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={handlePaymentMethodSuccess}
      />
    </>
  );
};