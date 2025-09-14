import { useState, useEffect } from "react";
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

  const fetchTransactions = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [{ data: transactionsData }, { data: consultantProfiles }] = await Promise.all([
        // Fetch transactions with booking relationships
        supabase
          .from('flexi_credits_transactions')
          .select(`
            *,
            bookings(
              consultant_id,
              consultants!bookings_consultant_id_fkey(user_id)
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),

        // Fetch consultant profiles for name mapping
        supabase
          .from('profiles')
          .select('user_id, full_name')
      ]);

      // Process transactions
      const processedTransactions: Transaction[] = (transactionsData || []).map(t => {
        const transactionType = t.amount > 0 ? 'earned' as const : 'spent' as const;
        
        // Get consultant name if transaction is linked to a booking
        let consultantName: string | undefined;
        if (t.bookings?.consultants) {
          const consultant = Array.isArray(t.bookings.consultants) ? t.bookings.consultants[0] : t.bookings.consultants;
          const consultantProfile = consultantProfiles?.find(p => p.user_id === consultant?.user_id);
          consultantName = consultantProfile?.full_name;
        }
        
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
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

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