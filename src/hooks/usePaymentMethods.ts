import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default?: boolean;
}

export const usePaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPaymentMethods = async (forceRefresh = false) => {
    setLoading(true);
    try {
      console.log('Fetching payment methods...', forceRefresh ? '(force refresh)' : '');
      
      // Clear any cached data if force refresh
      if (forceRefresh) {
        setPaymentMethods([]);
      }
      
      const { data, error } = await supabase.functions.invoke('list-payment-methods', {
        body: { timestamp: Date.now() } // Add timestamp to prevent caching
      });
      
      if (error) throw error;
      
      console.log('Payment methods received:', data.payment_methods);
      setPaymentMethods(data.payment_methods || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: "Error",
        description: "Failed to load payment methods",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupPaymentMethod = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('setup-payment-method');
      
      if (error) throw error;
      
      return data.client_secret;
    } catch (error) {
      console.error('Error setting up payment method:', error);
      toast({
        title: "Error",
        description: "Failed to setup payment method",
        variant: "destructive",
      });
      return null;
    }
  };

  const instantCharge = async (paymentMethodId: string, amount: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('instant-charge', {
        body: { payment_method_id: paymentMethodId, amount },
      });
      
      if (error) throw error;
      
      toast({
        title: "Success!",
        description: `Successfully added ${amount} points to your account`,
      });
      
      return data;
    } catch (error) {
      console.error('Error processing instant charge:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  return {
    paymentMethods,
    loading,
    fetchPaymentMethods,
    setupPaymentMethod,
    instantCharge,
  };
};