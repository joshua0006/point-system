import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, CreditCard, ShoppingCart, Gift, Users, Zap, DollarSign } from "lucide-react";

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

export function useOptimizedTransactionData() {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async (): Promise<{
      transactions: Transaction[];
      spentTransactions: Transaction[];
      earnedTransactions: Transaction[];
      recentTransactions: Transaction[];
      totalSpent: number;
      totalEarned: number;
    }> => {
      if (!user) {
        return {
          transactions: [],
          spentTransactions: [],
          earnedTransactions: [],
          recentTransactions: [],
          totalSpent: 0,
          totalEarned: 0,
        };
      }

      const { data: transactionsData, error } = await supabase
        .from('flexi_credits_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Process transactions with optimized logic
      const processedTransactions: Transaction[] = (transactionsData || []).map(t => {
        const isDebit = ['debit', 'purchase', 'refund'].includes(t.type);
        let category: Transaction['category'] = 'system';
        let icon = '💳';
        let service = t.description || 'Transaction';
        let transactionType: Transaction['type'] = 'purchase';

        // Categorize based on description and type
        if (t.type === 'admin_credit') {
          category = 'admin';
          icon = '👨‍💼';
          transactionType = 'admin_credit';
          service = `Admin Credit: ${t.description?.replace('Admin credit - ', '') || 'Credits added'}`;
        } else if (t.type === 'refund') {
          category = 'admin';
          icon = '↩️';
          transactionType = 'refund';
          service = `Admin Deduction: ${t.description?.replace('Admin deduction - ', '') || 'Credits deducted'}`;
        } else if (t.description?.toLowerCase().includes('subscription') || 
                   t.description?.toLowerCase().includes('plan upgrade')) {
          category = 'subscription';
          icon = '📋';
          transactionType = 'subscription';
          service = 'Subscription Transaction';
        } else if (t.description?.toLowerCase().includes('campaign')) {
          category = 'campaign';
          icon = '🎯';
          transactionType = 'campaign';
          service = 'Campaign Purchase';
        } else if (t.description?.toLowerCase().includes('booking')) {
          category = 'booking';
          icon = '📅';
          transactionType = 'booking';
          service = 'Service Booking';
        } else if (t.description?.toLowerCase().includes('top-up')) {
          category = 'topup';
          icon = '💰';
          transactionType = 'purchase';
          service = 'Account Top-up';
        }

        return {
          id: t.id,
          type: transactionType,
          subType: isDebit ? 'spent' : 'earned',
          rawType: t.type,
          service,
          consultant: undefined,
          points: Math.abs(Number(t.amount)),
          date: new Date(t.created_at).toLocaleDateString(),
          status: 'completed',
          category,
          icon,
        };
      });

      // Calculate aggregates
      const spentTransactions = processedTransactions.filter(t => t.subType === 'spent');
      const earnedTransactions = processedTransactions.filter(t => t.subType === 'earned');
      const recentTransactions = processedTransactions.slice(0, 10);
      
      const totalSpent = spentTransactions.reduce((sum, t) => sum + t.points, 0);
      const totalEarned = earnedTransactions.reduce((sum, t) => sum + t.points, 0);

      return {
        transactions: processedTransactions,
        spentTransactions,
        earnedTransactions,
        recentTransactions,
        totalSpent,
        totalEarned,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 3, // 3 minutes for transaction data
    gcTime: 1000 * 60 * 15, // 15 minutes
  });

  return {
    transactions: data?.transactions || [],
    spentTransactions: data?.spentTransactions || [],
    earnedTransactions: data?.earnedTransactions || [],
    recentTransactions: data?.recentTransactions || [],
    totalSpent: data?.totalSpent || 0,
    totalEarned: data?.totalEarned || 0,
    isLoading,
    error,
    refreshTransactions: refetch,
  };
}