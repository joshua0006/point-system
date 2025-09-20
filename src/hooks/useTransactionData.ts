import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Transaction {
  id: string;
  type: "purchase" | "admin_credit" | "refund" | "subscription" | "campaign" | "booking";
  subType: "spent" | "earned" | "adjustment";
  rawType: string; // Original database type
  service: string;
  consultant?: string;
  points: number;
  date: string;
  status: string;
  category: "subscription" | "campaign" | "admin" | "topup" | "booking" | "system";
  icon: string;
}

export function useTransactionData() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch recent transactions for the user (no broken joins)
      const { data: transactionsData, error } = await supabase
        .from('flexi_credits_transactions')
        .select('id, type, amount, description, created_at, booking_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Process transactions with proper categorization
      const processedTransactions: Transaction[] = (transactionsData || []).map(t => {
        const subType = t.amount > 0 ? 'earned' as const : 'spent' as const;
        
        // Determine transaction category and details
        let category: Transaction['category'] = 'system';
        let icon = '💳';
        let service = t.description || 'Transaction';
        
        // Enhanced categorization based on database type and description
        if (t.type === 'admin_credit') {
          category = 'admin';
          icon = '👨‍💼';
          service = `Admin Credit: ${t.description?.replace('Admin credit - ', '').replace(' flexi credits added by admin:', '') || 'Credits added'}`;
        } else if (t.type === 'refund') {
          category = 'admin';
          icon = '↩️';
          service = `Admin Deduction: ${t.description?.replace('Admin deduction - ', '').replace(' flexi credits deducted by admin:', '') || 'Credits deducted'}`;
        } else if (t.description?.toLowerCase().includes('subscription') || 
                   t.description?.toLowerCase().includes('plan upgrade') ||
                   t.description?.toLowerCase().includes('monthly subscription')) {
          category = 'subscription';
          icon = '📋';
          if (t.description.includes('Monthly subscription renewal')) {
            service = 'Monthly Subscription Renewal';
          } else if (t.description.includes('Plan upgrade')) {
            service = 'Plan Upgrade Credits';
          } else {
            service = 'Subscription Transaction';
          }
        } else if (t.description?.toLowerCase().includes('campaign') || 
                   t.description?.toLowerCase().includes('facebook ads') ||
                   t.description?.toLowerCase().includes('cold calling') ||
                   t.description?.toLowerCase().includes('va support')) {
          category = 'campaign';
          icon = '🎯';
          if (t.description.includes('Facebook Ads')) {
            service = 'Facebook Ads Campaign';
          } else if (t.description.includes('Cold Calling')) {
            service = 'Cold Calling Campaign';
          } else if (t.description.includes('VA Support') || t.description.includes('VA support')) {
            service = 'VA Support Campaign';
          } else {
            service = 'Campaign Purchase';
          }
        } else if (t.description?.toLowerCase().includes('top-up') || 
                   t.description?.toLowerCase().includes('stripe checkout')) {
          category = 'topup';
          icon = '💰';
          service = 'Account Top-up';
        } else if (t.booking_id) {
          category = 'booking';
          icon = '📅';
          service = 'Service Booking';
        }
        
        return {
          id: t.id,
          type: t.type as Transaction['type'],
          subType,
          rawType: t.type,
          service,
          consultant: undefined, // Could be enhanced with consultant lookup
          points: Math.abs(t.amount),
          date: new Date(t.created_at).toLocaleDateString(),
          status: 'completed',
          category,
          icon
        };
      });

      setTransactions(processedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, fetchTransactions]);

  // Calculate transaction stats
  const spentTransactions = transactions.filter(t => t.subType === 'spent');
  const earnedTransactions = transactions.filter(t => t.subType === 'earned');
  const recentTransactions = transactions.slice(0, 5); // Show more recent transactions
  
  const totalSpent = spentTransactions.reduce((sum, t) => sum + t.points, 0);
  const totalEarned = earnedTransactions.reduce((sum, t) => sum + t.points, 0);

  return {
    transactions,
    spentTransactions,
    earnedTransactions,
    recentTransactions,
    totalSpent,
    totalEarned,
    isLoading,
    refreshTransactions: fetchTransactions,
  };
}