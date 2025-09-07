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

export interface BookedService {
  id: string;
  service: string;
  consultant: string;
  date: string;
  time?: string;
  duration?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  points: number;
}

export interface UpcomingSession {
  id: string;
  service: string;
  consultant: string;
  date: string;
  time: string;
  duration: string;
  bookingUrl: string;
  status: 'confirmed' | 'pending';
  points: number;
}

export interface UserStats {
  totalPoints: number;
  pointsSpent: number;
  pointsEarned: number;
  servicesBooked: number;
  completedSessions: number;
}

export function useDashboardData() {
  const { user } = useAuth();
  
  console.log('useDashboardData initialized with user:', user?.id);
  
  // Modal states
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [spentModalOpen, setSpentModalOpen] = useState(false);
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [upcomingModalOpen, setUpcomingModalOpen] = useState(false);
  const [recentTransactionsModalOpen, setRecentTransactionsModalOpen] = useState(false);
  const [recentBookingsModalOpen, setRecentBookingsModalOpen] = useState(false);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [upcomingChargesModalOpen, setUpcomingChargesModalOpen] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [userStats, setUserStats] = useState<UserStats>({
    totalPoints: 0,
    pointsSpent: 0,
    pointsEarned: 0,
    servicesBooked: 0,
    completedSessions: 0,
  });
  
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [bookedServices, setBookedServices] = useState<BookedService[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingSession[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserData();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    console.log('fetchUserData called for user:', user.id);
    setIsLoading(true);

    try {
      // Optimize: Fetch all data in parallel to reduce loading time
      const [
        { data: profile, error: profileError },
        { data: transactions },
        { data: bookings },
      ] = await Promise.all([
        // Fetch user profile for points balance
        supabase
          .from('profiles')
          .select('flexi_credits_balance')
          .eq('user_id', user.id)
          .single(),
        
        // Fetch only recent transactions (limit to 20 for performance)
        supabase
          .from('flexi_credits_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),

        // Fetch bookings with proper joins (limit to 50 for performance)
        supabase
          .from('bookings')
          .select(`
            *,
            services!inner(title, duration_minutes),
            consultants!bookings_consultant_id_fkey(user_id)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      console.log('Profile fetch result:', { profile, profileError });

      // Get consultant profiles separately (only if needed)
      let consultantProfiles: any[] = [];
      const consultantUserIds = bookings?.map(b => {
        const consultant = Array.isArray(b.consultants) ? b.consultants[0] : b.consultants;
        return consultant?.user_id;
      }).filter(Boolean) || [];

      if (consultantUserIds.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', consultantUserIds);
        consultantProfiles = data || [];
      }

      // Process transactions - classify by amount sign for accuracy
      const processedTransactions: Transaction[] = (transactions || []).map(t => {
        // Positive amounts are earned, negative amounts are spent
        const transactionType = t.amount > 0 ? 'earned' as const : 'spent' as const;
        
        return {
          id: t.id,
          type: transactionType,
          service: t.description || 'Transaction',
          points: Math.abs(t.amount),
          date: new Date(t.created_at).toISOString().split('T')[0],
          status: 'completed'
        };
      });

      // Process bookings
      const processedBookings: BookedService[] = (bookings || []).map(b => {
        const consultant = Array.isArray(b.consultants) ? b.consultants[0] : b.consultants;
        const consultantProfile = consultantProfiles?.find(p => p.user_id === consultant?.user_id);
        return {
          id: b.id,
          service: b.services?.title || 'Unknown Service',
          consultant: consultantProfile?.full_name || 'Unknown Consultant',
          date: b.scheduled_at ? new Date(b.scheduled_at).toISOString().split('T')[0] : new Date(b.created_at).toISOString().split('T')[0],
          time: b.scheduled_at ? new Date(b.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
          duration: b.services?.duration_minutes ? `${b.services.duration_minutes} mins` : undefined,
          status: b.status,
          points: b.points_spent
        };
      });

      // Filter upcoming sessions (future bookings that are confirmed or pending only)
      const upcoming: UpcomingSession[] = processedBookings
        .filter(b => {
          const bookingDate = new Date(b.date);
          const now = new Date();
          return bookingDate > now && (b.status === 'confirmed' || b.status === 'pending');
        })
        .map(b => ({
          id: b.id,
          service: b.service,
          consultant: b.consultant,
          date: b.date,
          time: b.time || '00:00',
          duration: b.duration || '30 mins',
          bookingUrl: '#',
          status: b.status as 'confirmed' | 'pending',
          points: b.points
        }));

      // Calculate stats - sum by amount sign for accuracy
      const totalPoints = profile?.flexi_credits_balance || 0;
      const pointsSpent = (transactions || [])
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const pointsEarned = (transactions || [])
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
      const servicesBooked = processedBookings.length;
      const completedSessions = processedBookings.filter(b => b.status === 'completed').length;

      setUserStats({
        totalPoints,
        pointsSpent,
        pointsEarned,
        servicesBooked,
        completedSessions,
      });

      console.log('Dashboard stats:', {
        totalPoints,
        pointsSpent,
        pointsEarned,
        servicesBooked,
        completedSessions,
        transactionsCount: processedTransactions.length,
        bookingsCount: processedBookings.length
      });

      setAllTransactions(processedTransactions);
      setBookedServices(processedBookings);
      setUpcomingBookings(upcoming);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Keep default empty state on error
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!user?.id) return;

    // Set up real-time updates for points transactions and bookings
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
        (payload) => {
          console.log('Transaction updated:', payload);
          fetchUserData(); // Refresh data
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
        (payload) => {
          console.log('Booking updated:', payload);
          fetchUserData(); // Refresh data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const spentTransactions = allTransactions.filter(t => t.type === 'spent');
  const recentTransactions = allTransactions.slice(0, 3);

  console.log('useDashboardData returning userStats:', userStats);

  return {
    // Modal states
    balanceModalOpen,
    setBalanceModalOpen,
    spentModalOpen,
    setSpentModalOpen,
    servicesModalOpen,
    setServicesModalOpen,
    completionModalOpen,
    setCompletionModalOpen,
    upcomingModalOpen,
    setUpcomingModalOpen,
    recentTransactionsModalOpen,
    setRecentTransactionsModalOpen,
    recentBookingsModalOpen,
    setRecentBookingsModalOpen,
    topUpModalOpen,
    setTopUpModalOpen,
    upcomingChargesModalOpen,
    setUpcomingChargesModalOpen,
    
    // Data
    userStats,
    allTransactions,
    spentTransactions,
    bookedServices,
    upcomingBookings,
    recentTransactions,
    
    // Loading state
    isLoading,
    
    // Refresh function
    refreshData: fetchUserData,
  };
}
