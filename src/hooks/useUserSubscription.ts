import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  isActive: boolean;
  planName: string;
  subscriptionTier: string;
  creditsPerMonth: number;
  endDate?: string;
  subscriptionId?: string;
}

export function useUserSubscription() {
  const [subscriptionData, setSubscriptionData] = useState<Record<string, SubscriptionData>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [lastFetched, setLastFetched] = useState<Record<string, number>>({});
  const STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes


  const fetchUserSubscription = useCallback(async (userId: string, userEmail: string): Promise<SubscriptionData> => {
    // Avoid duplicate in-flight requests
    if (loading[userId]) {
      return subscriptionData[userId] || { isActive: false, planName: 'Loading', subscriptionTier: 'none', creditsPerMonth: 0 };
    }

    // Return cached value if it's fresh (including inactive subscriptions)
    const cached = subscriptionData[userId];
    const fetchedAt = lastFetched[userId];
    if (cached && fetchedAt && Date.now() - fetchedAt < STALE_TIME_MS) {
      return cached;
    }

    setLoading(prev => ({ ...prev, [userId]: true }));

    try {
      // Get user's auth token first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No session found');

      const { data, error } = await supabase.functions.invoke('admin-check-user-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'x-user-email': userEmail,
        },
        body: { userEmail },
      });

      if (error) throw error;

      const subscription: SubscriptionData = {
        isActive: Boolean(data?.subscribed),
        planName: data?.plan_name || 'No Plan',
        subscriptionTier: data?.subscription_tier || 'none',
        creditsPerMonth: data?.credits_per_month ?? 0,
        endDate: data?.subscription_end || data?.endDate,
        subscriptionId: data?.subscriptionId,
      };

      setSubscriptionData(prev => ({ ...prev, [userId]: subscription }));
      setLastFetched(prev => ({ ...prev, [userId]: Date.now() }));
      return subscription;
    } catch (error) {
      console.error('Error fetching subscription for user:', userEmail, error);
      const fallback: SubscriptionData = {
        isActive: false,
        planName: 'No Plan',
        subscriptionTier: 'none',
        creditsPerMonth: 0,
      };
      setSubscriptionData(prev => ({ ...prev, [userId]: fallback }));
      setLastFetched(prev => ({ ...prev, [userId]: Date.now() }));
      return fallback;
    } finally {
      setLoading(prev => ({ ...prev, [userId]: false }));
    }
  }, [subscriptionData, loading, lastFetched]);

  const getSubscriptionBadge = (subscription: SubscriptionData, isLoading: boolean) => {
    if (isLoading) {
      return { variant: 'outline' as const, text: 'Loading...' };
    }
    
    if (!subscription.isActive) {
      return { variant: 'secondary' as const, text: 'No Plan' };
    }
    
    return { variant: 'default' as const, text: subscription.planName };
  };

  return {
    fetchUserSubscription,
    getSubscriptionBadge,
    isLoading: (userId: string) => loading[userId] || false,
    getSubscription: (userId: string) => subscriptionData[userId]
  };
}