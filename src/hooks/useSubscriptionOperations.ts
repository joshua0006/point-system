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
  nextBillingDate: string;
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

  const processSubscriptionChange = async (credits: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: { credits }
      });
      
      if (error) throw error;
      
      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      
      toast({
        title: "Redirected to Stripe Checkout",
        description: "Complete your payment in the new tab to activate your subscription.",
      });
      
      return true;
    } catch (error: any) {
      console.error('Error processing subscription:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process subscription",
        variant: "destructive",
      });
      return false;
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