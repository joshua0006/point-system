
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
  
  // Modal states
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [spentModalOpen, setSpentModalOpen] = useState(false);
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [upcomingModalOpen, setUpcomingModalOpen] = useState(false);
  const [recentTransactionsModalOpen, setRecentTransactionsModalOpen] = useState(false);
  const [recentBookingsModalOpen, setRecentBookingsModalOpen] = useState(false);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);

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
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch user profile for points balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('points_balance')
        .eq('user_id', user.id)
        .single();

      // Fetch points transactions
      const { data: transactions } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch bookings with proper joins
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          *,
          services!inner(title, duration_minutes),
          consultants!inner(user_id)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Get consultant profiles separately
      const consultantUserIds = bookings?.map(b => b.consultants?.user_id).filter(Boolean) || [];
      const { data: consultantProfiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', consultantUserIds);

      // Process transactions
      const processedTransactions: Transaction[] = (transactions || []).map(t => {
        // Determine if transaction is spent or earned based on type
        const isSpent = ['purchase'].includes(t.type);
        const isEarned = ['initial_credit', 'admin_credit', 'earning'].includes(t.type);
        
        return {
          id: t.id,
          type: isSpent ? 'spent' : 'earned',
          service: t.description || 'Transaction',
          points: Math.abs(t.amount),
          date: new Date(t.created_at).toISOString().split('T')[0],
          status: 'completed'
        };
      });

      // Process bookings
      const processedBookings: BookedService[] = (bookings || []).map(b => {
        const consultantProfile = consultantProfiles?.find(p => p.user_id === b.consultants?.user_id);
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

      // Calculate stats
      const totalPoints = profile?.points_balance || 0;
      const pointsSpent = processedTransactions
        .filter(t => t.type === 'spent')
        .reduce((sum, t) => sum + t.points, 0);
      const pointsEarned = processedTransactions
        .filter(t => t.type === 'earned')
        .reduce((sum, t) => sum + t.points, 0);
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
    }
  };

  const spentTransactions = allTransactions.filter(t => t.type === 'spent');
  const recentTransactions = allTransactions.slice(0, 3);

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
    
    // Data
    userStats,
    allTransactions,
    spentTransactions,
    bookedServices,
    upcomingBookings,
    recentTransactions,
    
    // Refresh function
    refreshData: fetchUserData,
  };
}
