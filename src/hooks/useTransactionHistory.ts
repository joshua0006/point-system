import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TransactionHistoryItem {
  id: string;
  type: "spent" | "earned";
  service?: string;
  consultant?: string;
  points: number;
  date: string;
  status: string;
}

export function useTransactionHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transaction-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: transactions, error } = await supabase
        .from('points_transactions')
        .select(`
          id,
          type,
          amount,
          created_at,
          description,
          booking_id,
          bookings (
            services (
              title,
              consultant_id,
              consultants (
                user_id
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }

      // For services with consultants, fetch consultant names separately
      const consultantIds = transactions
        ?.filter(t => t.bookings?.services?.consultants?.user_id)
        .map(t => t.bookings!.services!.consultants!.user_id)
        .filter(Boolean) || [];

      let consultantNames: Record<string, string> = {};
      
      if (consultantIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', consultantIds);
        
        consultantNames = (profiles || []).reduce((acc, profile) => {
          acc[profile.user_id] = profile.full_name || 'Unknown';
          return acc;
        }, {} as Record<string, string>);
      }

      // Transform the data to match the expected interface
      const transformedTransactions: TransactionHistoryItem[] = (transactions || []).map(t => {
        const serviceTitle = t.bookings?.services?.title;
        const consultantUserId = t.bookings?.services?.consultants?.user_id;
        const consultantName = consultantUserId ? consultantNames[consultantUserId] : undefined;
        
        // Determine transaction type based on amount and type
        // Positive amounts are always "earned" regardless of type (top-ups, credits, etc.)
        // Negative amounts are always "spent" (purchases, deductions, etc.)
        const transactionType = t.amount > 0 ? 'earned' as const : 'spent' as const;
        
        return {
          id: t.id,
          type: transactionType,
          service: serviceTitle || t.description || 'Transaction',
          consultant: consultantName,
          points: Math.abs(t.amount),
          date: new Date(t.created_at).toLocaleDateString(),
          status: 'completed'
        };
      });

      return transformedTransactions;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
  });
}