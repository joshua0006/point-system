import { useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTransactionData, type Transaction } from "./useTransactionData";
import { useBookingData, type BookedService, type UpcomingSession } from "./useBookingData";

// Re-export types for backward compatibility
export type { Transaction, BookedService, UpcomingSession };

export interface UserStats {
  totalPoints: number;
  pointsSpent: number;
  pointsEarned: number;
  servicesBooked: number;
  completedSessions: number;
}

export function useDashboardData() {
  const { user, profile } = useAuth();
  
  // Use focused hooks for different data types
  const transactionData = useTransactionData();
  const bookingData = useBookingData();

  // Memoize refresh functions to prevent unnecessary re-renders
  const memoizedRefreshTransactions = useCallback(() => {
    transactionData.refreshTransactions();
  }, [transactionData.refreshTransactions]);

  const memoizedRefreshBookings = useCallback(() => {
    bookingData.refreshBookings();
  }, [bookingData.refreshBookings]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (user?.id) {
      const channel = supabase
        .channel('buyer-dashboard-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'flexi_credits_transactions',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            memoizedRefreshTransactions();
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
            memoizedRefreshBookings();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id, memoizedRefreshTransactions, memoizedRefreshBookings]);

  // Calculate combined stats from hooks - memoized for performance
  const userStats: UserStats = useMemo(() => ({
    totalPoints: profile?.flexi_credits_balance || 0,
    pointsSpent: transactionData.totalSpent,
    pointsEarned: transactionData.totalEarned,
    servicesBooked: bookingData.servicesBooked,
    completedSessions: bookingData.completedSessions,
  }), [
    profile?.flexi_credits_balance,
    transactionData.totalSpent,
    transactionData.totalEarned,
    bookingData.servicesBooked,
    bookingData.completedSessions,
  ]);

  const isLoading = useMemo(() => 
    transactionData.isLoading || bookingData.isLoading,
    [transactionData.isLoading, bookingData.isLoading]
  );
  
  const refreshData = useCallback(() => {
    memoizedRefreshTransactions();
    memoizedRefreshBookings();
  }, [memoizedRefreshTransactions, memoizedRefreshBookings]);

  return {
    // Data
    userStats,
    allTransactions: transactionData.transactions,
    spentTransactions: transactionData.spentTransactions,
    bookedServices: bookingData.bookedServices,
    upcomingBookings: bookingData.upcomingBookings,
    recentTransactions: transactionData.recentTransactions,
    
    // Loading state
    isLoading,
    
    // Refresh function
    refreshData,
  };
}
