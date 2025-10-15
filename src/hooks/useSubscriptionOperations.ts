import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SubscriptionPlan {
  credits: number;
  price: number;
  title: string;
  popular?: boolean;
}

export interface ProrationDetails {
  currentAmount: number;
  newAmount: number;
  prorationAmount: number;
  nextBillingDate: string; // ISO date string
  billingDetails?: {
    daysRemaining: number;
    daysInMonth: number;
    nextBillingDateFormatted: string;
  };
}

export function useSubscriptionOperations() {
  const [loading, setLoading] = useState(false);
  const [loadingProration, setLoadingProration] = useState(false);
  const { toast } = useToast();

  const fetchProrationDetails = async (credits: number): Promise<ProrationDetails | null> => {
    setLoadingProration(true);
    try {
      const { data, error } = await supabase.functions.invoke('preview-subscription-change', {
        body: { credits }
      });
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching proration details:', error);
      toast({
        title: "Error",
        description: "Failed to calculate proration. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoadingProration(false);
    }
  };

  const processSubscriptionChange = async (credits: number, hasSubscription: boolean) => {
    setLoading(true);
    try {
      if (hasSubscription) {
        // For existing subscribers, use update-subscription for proper proration
        const { data, error } = await supabase.functions.invoke('update-subscription', {
          body: { credits }
        });

        if (error) throw error;

        // Note: Confirmation email will be sent by webhook after successful payment
        // Don't send email here to avoid sending before payment is complete

        if (data.checkout_url) {
          // Return checkout_url so caller can handle redirect
          // Don't use window.open to avoid popup blockers
          return { success: true, data, requiresPayment: true };
        } else {
          // Handle downgrade or no checkout needed
          toast({
            title: "Subscription Updated Successfully!",
            description: data.message || "Your subscription has been updated.",
          });
          return { success: true, data, requiresPayment: false };
        }
      } else {
        // For new subscribers, use create-subscription-checkout
        const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
          body: { credits }
        });

        if (error) throw error;

        // Return checkout URL for caller to handle redirect
        // Use window.location.href to avoid popup blockers
        return { success: true, data, requiresPayment: true };
      }
    } catch (error: any) {
      console.error('Error processing subscription:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process subscription",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      window.open(data.url, '_blank');
      return true;
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    loadingProration,
    fetchProrationDetails,
    processSubscriptionChange,
    openCustomerPortal,
  };
}