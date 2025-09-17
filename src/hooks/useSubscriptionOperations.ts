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
        
        // Send confirmation email
        try {
          await supabase.functions.invoke('send-subscription-emails', {
            body: { 
              emailType: 'upgrade',
              subscriptionData: { 
                credits, 
                upgradeCreditsAdded: data.upgrade_credits_added 
              }
            }
          });
        } catch (emailError) {
          console.warn('Failed to send confirmation email:', emailError);
        }
        
        if (data.checkout_url) {
          // Open Stripe checkout for upgrade payment
          window.open(data.checkout_url, '_blank');
          
          toast({
            title: "Redirected to Payment",
            description: `Complete your S$${data.billing_info?.immediate_charge || 0} payment to upgrade your plan.`,
          });
        } else {
          toast({
            title: "Subscription Updated Successfully!",
            description: `Your plan has been upgraded and ${data.upgrade_credits_added || 0} credits have been added to your account.`,
          });
        }
        
        return { success: true, data };
      } else {
        // For new subscribers, use create-subscription-checkout
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
        
        return { success: true, data };
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