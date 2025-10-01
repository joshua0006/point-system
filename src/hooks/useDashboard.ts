import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useCallback } from 'react';

// Unified transaction interface
export interface Transaction {
  id: string;
  type: "purchase" | "admin_credit" | "refund" | "subscription" | "campaign" | "booking";
  subType: "spent" | "earned" | "adjustment";
  rawType: string;
  service: string;
  consultant?: string;
  points: number;
  date: string;
  status: string;
  category: "subscription" | "campaign" | "admin" | "topup" | "booking" | "system";
  icon: string;
}

// Unified booking interfaces
export interface BookedService {
  id: string;
  serviceName: string;
  consultantName: string;
  consultantAvatar?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  scheduledDate?: string;
  pointsSpent: number;
  category?: string;
  // Required backward compatibility aliases
  service: string;
  consultant: string;
  date: string;
  points: number;
}

export interface UpcomingSession extends BookedService {
  scheduledAt: string;
  status: "pending" | "confirmed";
  time: string;
  duration: string;
  bookingUrl: string;
}

// Unified stats interface
export interface UserStats {
  totalPointsSpent: number;
  totalPointsEarned: number;
  servicesBooked: number;
  completedSessions: number;
  completionRate: number;
  currentBalance: number;
  totalPoints: number;
  pointsSpent: number;
  pointsEarned: number;
}

/**
 * Unified dashboard data hook with optimized caching and real-time updates
 * Replaces: useDashboardData, useOptimizedDashboardData, useTransactionData, useBookingData
 */
export function useDashboard() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // Fetch transactions with aggressive caching
  const {
    data: transactionData,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ['dashboard-transactions', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('flexi_credits_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Process transactions
      const processed: Transaction[] = (data || []).map(t => {
        const isDebit = ['debit', 'purchase', 'refund'].includes(t.type);
        let category: Transaction['category'] = 'system';
        let icon = '💳';
        let service = t.description || 'Transaction';
        let transactionType: Transaction['type'] = 'purchase';

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
        } else if (t.description?.toLowerCase().includes('campaign')) {
          category = 'campaign';
          icon = '🎯';
          transactionType = 'campaign';
        } else if (t.description?.toLowerCase().includes('booking')) {
          category = 'booking';
          icon = '📅';
          transactionType = 'booking';
        } else if (t.description?.toLowerCase().includes('top-up')) {
          category = 'topup';
          icon = '💰';
          transactionType = 'purchase';
        }

        return {
          id: t.id,
          type: transactionType,
          subType: isDebit ? 'spent' as const : 'earned' as const,
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

      const spent = processed.filter(t => t.subType === 'spent');
      const earned = processed.filter(t => t.subType === 'earned');
      
      return {
        all: processed,
        spent,
        earned,
        recent: processed.slice(0, 10),
        totalSpent: spent.reduce((sum, t) => sum + t.points, 0),
        totalEarned: earned.reduce((sum, t) => sum + t.points, 0),
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Fetch bookings with parallel consultant queries
  const {
    data: bookingData,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ['dashboard-bookings', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const [bookingsResult, consultantsResult] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('consultants').select('id, user_id')
      ]);

      if (bookingsResult.error) throw bookingsResult.error;

      const bookings = bookingsResult.data || [];
      const consultantsMap = new Map(
        (consultantsResult.data || []).map(c => [c.id, c.user_id])
      );

      // Get unique consultant user IDs
      const consultantUserIds = [...new Set(
        bookings.map(b => consultantsMap.get(b.consultant_id)).filter(Boolean)
      )];

      // Fetch consultant profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', consultantUserIds);

      const profilesMap = new Map(
        (profiles || []).map(p => [p.user_id, p])
      );

      // Process bookings
      const processed: BookedService[] = bookings.map(b => {
        const consultantUserId = consultantsMap.get(b.consultant_id);
        const profile = consultantUserId ? profilesMap.get(consultantUserId) : null;

        const serviceName = `Service #${b.service_id.slice(0, 8)}`;
        const consultantName = profile?.full_name || 'Unknown';
        const scheduledDate = b.scheduled_at ? new Date(b.scheduled_at).toLocaleDateString() : new Date().toLocaleDateString();
        const pointsSpent = b.points_spent;
        const status = (b.status as "pending" | "confirmed" | "completed" | "cancelled") || "pending";

        return {
          id: b.id,
          serviceName,
          consultantName,
          consultantAvatar: profile?.avatar_url,
          status,
          scheduledDate,
          pointsSpent,
          category: 'booking',
          // Required backward compatibility
          service: serviceName,
          consultant: consultantName,
          date: scheduledDate,
          points: pointsSpent,
          time: b.scheduled_at ? new Date(b.scheduled_at).toLocaleTimeString() : '12:00 PM',
          duration: '60 min',
          bookingUrl: '#',
          scheduledAt: b.scheduled_at || new Date().toISOString(),
        };
      });

      const upcoming = processed.filter(b => 
        b.scheduledDate && new Date(b.scheduledDate) > new Date()
      ) as UpcomingSession[];

      const completed = processed.filter(b => b.status === 'completed').length;
      const total = processed.length;

      return {
        all: processed,
        upcoming,
        count: total,
        completed,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flexi_credits_transactions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-transactions', user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-bookings', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Unified stats
  const userStats: UserStats = {
    totalPointsSpent: transactionData?.totalSpent || 0,
    totalPointsEarned: transactionData?.totalEarned || 0,
    servicesBooked: bookingData?.count || 0,
    completedSessions: bookingData?.completed || 0,
    completionRate: bookingData?.completionRate || 0,
    currentBalance: profile?.flexi_credits_balance || 0,
    totalPoints: profile?.flexi_credits_balance || 0,
    pointsSpent: transactionData?.totalSpent || 0,
    pointsEarned: transactionData?.totalEarned || 0,
  };

  const refreshData = useCallback(async () => {
    await Promise.all([
      refetchTransactions(),
      refetchBookings(),
    ]);
  }, [refetchTransactions, refetchBookings]);

  return {
    // Stats
    userStats,
    
    // Transactions
    allTransactions: transactionData?.all || [],
    spentTransactions: transactionData?.spent || [],
    earnedTransactions: transactionData?.earned || [],
    recentTransactions: transactionData?.recent || [],
    
    // Bookings
    bookedServices: bookingData?.all || [],
    upcomingBookings: bookingData?.upcoming || [],
    
    // State
    isLoading: transactionsLoading || bookingsLoading,
    
    // Actions
    refreshData,
  };
}
