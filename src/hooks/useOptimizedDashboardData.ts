import { useMemo } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useOptimizedTransactionData } from './useOptimizedTransactionData';
import { useOptimizedBookingData } from './useOptimizedBookingData';

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

export function useOptimizedDashboardData() {
  const { profile } = useAuth();
  
  const {
    transactions: allTransactions,
    spentTransactions,
    recentTransactions,
    totalSpent,
    totalEarned,
    isLoading: transactionsLoading,
    refreshTransactions,
  } = useOptimizedTransactionData();

  const {
    bookedServices,
    upcomingBookings,
    servicesBooked,
    completedSessions,
    completionRate,
    isLoading: bookingsLoading,
    refreshBookings,
  } = useOptimizedBookingData();

  // Memoize user stats calculation
  const userStats: UserStats = useMemo(() => ({
    totalPointsSpent: totalSpent,
    totalPointsEarned: totalEarned,
    servicesBooked,
    completedSessions,
    completionRate,
    currentBalance: profile?.flexi_credits_balance || 0,
    totalPoints: profile?.flexi_credits_balance || 0,
    pointsSpent: totalSpent,
    pointsEarned: totalEarned,
  }), [totalSpent, totalEarned, servicesBooked, completedSessions, completionRate, profile?.flexi_credits_balance]);

  // Memoize loading state
  const isLoading = useMemo(() => 
    transactionsLoading || bookingsLoading, 
    [transactionsLoading, bookingsLoading]
  );

  // Memoize refresh function
  const refreshData = useMemo(() => async () => {
    await Promise.all([
      refreshTransactions(),
      refreshBookings(),
    ]);
  }, [refreshTransactions, refreshBookings]);

  return {
    userStats,
    allTransactions,
    spentTransactions,
    recentTransactions,
    bookedServices,
    upcomingBookings,
    isLoading,
    refreshData,
  };
}