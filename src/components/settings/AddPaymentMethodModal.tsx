import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

// Replace with your actual Stripe publishable key from Stripe Dashboard  
// Get it from: https://dashboard.stripe.com/apikeys (Live mode)
const stripePromise = loadStripe("pk_live_51HRUzmII7A7fKDtYXKedfcKrVhXpu8QSqmG5fRUqPLPMH5QYiQY0Ep3lJYHkyjO91LX1vT3RLcWWMFEKuk7qDAQD00qUya57AX");

interface AddPaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (showSuccessModal?: boolean) => void;
}

export const AddPaymentMethodModal = ({ open, onOpenChange, onSuccess }: AddPaymentMethodModalProps) => {
  const { setupPaymentMethod } = usePaymentMethods();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [elements, setElements] = useState<any>(null);
  const [stripe, setStripe] = useState<any>(null);
  const [cardElement, setCardElement] = useState<any>(null);

  useEffect(() => {
    const initializeStripe = async () => {
      const stripeInstance = await stripePromise;
      setStripe(stripeInstance);
    };
    initializeStripe();
  }, []);

  useEffect(() => {
    if (stripe && open) {
      const elementsInstance = stripe.elements();
      setElements(elementsInstance);
      
      const cardElementInstance = elementsInstance.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
              color: '#aab7c4',
            },
          },
        },
      });
      
      setCardElement(cardElementInstance);
      
      // Mount the card element after a brief delay to ensure the DOM is ready
      setTimeout(() => {
        const cardElementDiv = document.getElementById('card-element');
        if (cardElementDiv && cardElementInstance) {
          cardElementInstance.mount('#card-element');
        }
      }, 100);
    }

    return () => {
      if (cardElement) {
        cardElement.unmount();
      }
    };
  }, [stripe, open]);

  const handleSubmit = async () => {
    if (!stripe || !cardElement) {
      toast({
        title: "Error",
        description: "Stripe is not loaded. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Get the client secret from your backend
      const clientSecret = await setupPaymentMethod();
      if (!clientSecret) {
        throw new Error("Failed to get client secret");
      }

      // Confirm the setup intent with the card details
      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        throw error;
      }

      // Save the payment method to your database
      const { error: dbError } = await supabase
        .from('payment_methods')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          stripe_payment_method_id: setupIntent.payment_method,
          stripe_customer_id: setupIntent.customer,
          is_default: false,
        });

      if (dbError) {
        console.error('Database error:', dbError);
        // Continue anyway, as the payment method is saved in Stripe
      }

      // Show success modal instead of just toast
      onSuccess(true);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Payment method setup error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add payment method. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Card Information</label>
            <div 
              id="card-element" 
              className="p-3 border border-border rounded-md bg-background"
              style={{ minHeight: '40px' }}
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !stripe || !cardElement}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                "Add Payment Method"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};