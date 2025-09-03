import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AdminBillingStats {
  totalRevenue: number;
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
  averageUserBalance: number;
  totalTransactions: number;
  topUpRevenue: number;
  subscriptionRevenue: number;
}

export interface GlobalTransaction {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  type: "spent" | "earned";
  amount: number;
  description: string;
  created_at: string;
  booking_id?: string;
  service_title?: string;
  consultant_name?: string;
}

export function useAdminBilling() {
  const { profile } = useAuth();

  const billingStats = useQuery({
    queryKey: ['admin-billing-stats'],
    queryFn: async (): Promise<AdminBillingStats> => {
      // Fetch all user profiles for stats
      const { data: profiles } = await supabase
        .from('profiles')
        .select('flexi_credits_balance');

      // Fetch all transactions
      const { data: transactions } = await supabase
        .from('flexi_credits_transactions')
        .select('amount, type, created_at');

      // Fetch subscribers info
      const { data: subscribers } = await supabase
        .from('subscribers')
        .select('subscribed, subscription_tier, credits_per_month');

      const totalUsers = profiles?.length || 0;
      const totalUserBalance = profiles?.reduce((sum, p) => sum + (p.flexi_credits_balance || 0), 0) || 0;
      const averageUserBalance = totalUsers > 0 ? totalUserBalance / totalUsers : 0;

      const activeSubscriptions = subscribers?.filter(s => s.subscribed)?.length || 0;
      
      // Calculate revenues - earned transactions represent money coming in
      const earnedTransactions = transactions?.filter(t => t.amount > 0) || [];
      const topUpRevenue = earnedTransactions
        .filter(t => t.type === 'purchase' || t.type === 'initial_credit')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const subscriptionRevenue = earnedTransactions
        .filter(t => t.type === 'earning')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalRevenue = topUpRevenue + subscriptionRevenue;

      // Calculate MRR based on active subscriptions
      const monthlyRecurringRevenue = subscribers
        ?.filter(s => s.subscribed)
        ?.reduce((sum, s) => sum + (s.credits_per_month || 0), 0) || 0;

      return {
        totalRevenue,
        totalUsers,
        activeSubscriptions,
        monthlyRecurringRevenue,
        averageUserBalance,
        totalTransactions: transactions?.length || 0,
        topUpRevenue,
        subscriptionRevenue,
      };
    },
    enabled: profile?.role === 'admin',
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return billingStats;
}

export function useGlobalTransactions(filters?: {
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  userId?: string;
}) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['admin-global-transactions', filters],
    queryFn: async (): Promise<GlobalTransaction[]> => {
      let query = supabase
        .from('flexi_credits_transactions')
        .select(`
          id,
          user_id,
          type,
          amount,
          description,
          created_at,
          booking_id,
          bookings (
            services (
              title,
              consultants (
                user_id
              )
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      // Apply filters
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters?.type && filters.type !== 'all') {
        const isEarned = filters.type === 'earned';
        query = isEarned ? query.gt('amount', 0) : query.lt('amount', 0);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      const { data: transactions, error } = await query;

      if (error) {
        console.error('Error fetching global transactions:', error);
        throw error;
      }

      // Fetch user profiles for all unique user IDs
      const userIds = [...new Set(transactions?.map(t => t.user_id) || [])];
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', userIds);

      // Fetch consultant profiles if needed
      const consultantUserIds = transactions
        ?.map(t => t.bookings?.services?.consultants?.user_id)
        .filter(Boolean) || [];
      
      let consultantNames: Record<string, string> = {};
      if (consultantUserIds.length > 0) {
        const { data: consultantProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', consultantUserIds);
        
        consultantNames = (consultantProfiles || []).reduce((acc, profile) => {
          acc[profile.user_id] = profile.full_name || 'Unknown';
          return acc;
        }, {} as Record<string, string>);
      }

      // Transform the data
      const transformedTransactions: GlobalTransaction[] = (transactions || []).map(t => {
        const userProfile = userProfiles?.find(p => p.user_id === t.user_id);
        const consultantUserId = t.bookings?.services?.consultants?.user_id;
        const consultantName = consultantUserId ? consultantNames[consultantUserId] : undefined;
        
        return {
          id: t.id,
          user_id: t.user_id,
          user_email: userProfile?.email || 'Unknown',
          user_name: userProfile?.full_name || 'Unknown User',
          type: t.amount > 0 ? 'earned' : 'spent',
          amount: Math.abs(t.amount),
          description: t.description || 'Transaction',
          created_at: t.created_at,
          booking_id: t.booking_id || undefined,
          service_title: t.bookings?.services?.title,
          consultant_name: consultantName,
        };
      });

      return transformedTransactions;
    },
    enabled: profile?.role === 'admin',
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}