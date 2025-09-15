import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Transaction {
  id: string;
  type: "spent" | "earned";
  service: string;
  consultant?: string;
  points: number;
  date: string;
  status: string;
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

      // Process transactions
      const processedTransactions: Transaction[] = (transactionsData || []).map(t => {
        const transactionType = t.amount > 0 ? 'earned' as const : 'spent' as const;
        
        // Consultant info not joined in this query; can be fetched separately if needed
        let consultantName: string | undefined = undefined;
        
        return {
          id: t.id,
          type: transactionType,
          service: t.description || 'Transaction',
          consultant: consultantName,
          points: Math.abs(t.amount),
          date: new Date(t.created_at).toISOString().split('T')[0],
          status: 'completed'
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
  const spentTransactions = transactions.filter(t => t.type === 'spent');
  const earnedTransactions = transactions.filter(t => t.type === 'earned');
  const recentTransactions = transactions.slice(0, 3);
  
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