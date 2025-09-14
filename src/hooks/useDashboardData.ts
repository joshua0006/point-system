import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useModalState } from "./useModalState";
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
  
  console.log('useDashboardData initialized with user:', user?.id);
  
  // Use focused hooks for different data types
  const modalState = useModalState();
  const transactionData = useTransactionData();
  const bookingData = useBookingData();

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
            console.log('Transaction updated - refreshing data');
            transactionData.refreshTransactions();
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
            console.log('Booking updated - refreshing data');
            bookingData.refreshBookings();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  // Calculate combined stats from hooks
  const userStats: UserStats = {
    totalPoints: profile?.flexi_credits_balance || 0,
    pointsSpent: transactionData.totalSpent,
    pointsEarned: transactionData.totalEarned,
    servicesBooked: bookingData.servicesBooked,
    completedSessions: bookingData.completedSessions,
  };

  const isLoading = transactionData.isLoading || bookingData.isLoading;
  
  const refreshData = () => {
    transactionData.refreshTransactions();
    bookingData.refreshBookings();
  };

  console.log('useDashboardData returning userStats:', userStats);

  return {
    // Modal states (destructured from modalState hook)
    ...modalState,
    
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
