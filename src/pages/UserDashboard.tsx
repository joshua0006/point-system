
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useBuyerRatingStats } from "@/hooks/useBuyerReviews";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { DashboardModals } from "@/components/dashboard/DashboardModals";
import { useDashboardData } from "@/hooks/useDashboardData";
import { SuccessModal } from "@/components/SuccessModal";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  TrendingUp,
  Calendar,
  CheckCircle,
  Wallet,
  Users
} from "lucide-react";

export default function UserDashboard() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const {
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
    userStats,
    allTransactions,
    spentTransactions,
    bookedServices,
    upcomingBookings,
    recentTransactions,
    refreshData,
  } = useDashboardData();
  
  // Real data states
  const [consultantProfile, setConsultantProfile] = useState({
    name: "",
    tier: "bronze" as "bronze" | "silver" | "gold" | "platinum",
    totalEarnings: 0,
    totalSpendings: 0,
    totalSessions: 0,
    totalPurchases: 0,
    pointsBalance: 0,
    completionRate: 0,
    totalServices: 0
  });

  const [transactions, setTransactions] = useState<any[]>([]);
  const [demoBookedServices, setDemoBookedServices] = useState<any[]>([]);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{ type: "payment-method" | "top-up", amount?: number }>({ type: "top-up" });

  // Get real review data
  const { data: buyerReviewStats } = useBuyerRatingStats(user?.id || '');

  useEffect(() => {
    console.log('User state in dashboard:', user);
    if (user?.id) {
      console.log('User ID found, fetching data...');
      fetchConsultantData();
    } else {
      console.log('No user found, setting empty state');
      // Set default empty state when no user
      setConsultantProfile({
        name: "Guest User",
        tier: "bronze",
        totalEarnings: 0,
        totalSpendings: 0,
        totalSessions: 0,
        totalPurchases: 0,
        pointsBalance: 0,
        completionRate: 0,
        totalServices: 0
      });
    }

    // Set up real-time updates for points transactions and bookings
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
          (payload) => {
            console.log('Transaction updated:', payload);
            fetchConsultantData(); // Refresh data
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
            fetchConsultantData(); // Refresh data
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchConsultantData = async () => {
    try {
      console.log('Fetching buyer data for user:', user?.id);
      
      // Fetch user profile for points balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      console.log('Profile data:', profile, 'Error:', profileError);

      // Fetch real points transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('flexi_credits_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      console.log('Transactions data:', transactions, 'Error:', transactionsError);

      // Fetch real bookings with service and consultant details
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          services!inner(
            title,
            price,
            consultant_id
          ),
          consultants!bookings_consultant_id_fkey(
            user_id
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      console.log('Bookings data:', bookings, 'Error:', bookingsError);

      // Get consultant profiles for display names
      const consultantUserIds = bookings?.map(b => {
        const consultant = Array.isArray(b.consultants) ? b.consultants[0] : b.consultants;
        return consultant?.user_id;
      }).filter(Boolean) || [];
      const { data: consultantProfiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', consultantUserIds);

      // Calculate real stats
      const totalBookings = bookings?.length || 0;
      const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
      const totalSpent = transactions?.filter(t => t.type === 'purchase').reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

      setConsultantProfile({
        name: profile?.full_name || "Professional Buyer",
        tier: "bronze",
        totalEarnings: 0, // Buyers don't earn
        totalSpendings: totalSpent,
        totalSessions: totalBookings,
        totalPurchases: totalBookings,
        pointsBalance: profile?.flexi_credits_balance || 0,
        completionRate: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0,
        totalServices: 0
      });

      // Transform real transactions for display
      const transformedTransactions = (transactions || []).map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description || 'Transaction',
        created_at: t.created_at
      }));

      // Transform real bookings for display
      const transformedBookings = (bookings || []).map(b => {
        const consultant = Array.isArray(b.consultants) ? b.consultants[0] : b.consultants;
        const consultantProfile = consultantProfiles?.find(p => p.user_id === consultant?.user_id);
        return {
          id: b.id,
          status: b.status,
          created_at: b.created_at,
          services: { 
            title: b.services?.title || 'Unknown Service',
            price: b.services?.price || 0
          },
          points_spent: b.points_spent,
          consultant_name: consultantProfile?.full_name || 'Unknown Consultant'
        };
      });

      setTransactions(transformedTransactions);
      setDemoBookedServices(transformedBookings);

    } catch (error) {
      console.error('Error fetching buyer data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className={isMobile ? "container mx-auto px-2 py-4" : "container mx-auto px-4 py-8"}>
        {/* Header */}
        <div className={isMobile ? "mb-6" : "mb-8"}>
          <h1 className={isMobile ? "text-2xl font-bold text-foreground mb-2" : "text-3xl font-bold text-foreground mb-2"}>
            My Dashboard
          </h1>
          <p className={isMobile ? "text-sm text-muted-foreground" : "text-muted-foreground"}>
            Track your flexi-credits, bookings, and consultation history
          </p>
        </div>

        {/* Stats Cards */}
        <div className={isMobile ? "grid grid-cols-1 gap-4 mb-6" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"}>
          <Card 
            className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setBalanceModalOpen(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Flexi-Credits Balance
                <Wallet className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{consultantProfile.pointsBalance.toLocaleString()}</div>
              <p className="text-xs opacity-90">available flexi-credits</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSpentModalOpen(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Total Spent
                <TrendingUp className="w-4 h-4 text-destructive" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{consultantProfile.totalSpendings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">flexi-credits spent</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setServicesModalOpen(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Services Booked
                <Calendar className="w-4 h-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{consultantProfile.totalSessions}</div>
              <p className="text-xs text-muted-foreground">total bookings</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setCompletionModalOpen(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Completion Rate
                <CheckCircle className="w-4 h-4 text-success" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {Math.round(consultantProfile.completionRate)}%
              </div>
              <p className="text-xs text-muted-foreground">success rate</p>
            </CardContent>
          </Card>
        </div>

        <div className={isMobile ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 lg:grid-cols-2 gap-8"}>
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setRecentTransactionsModalOpen(true)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{transaction.description || 'Transaction'}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`font-semibold ${transaction.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount} credits
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No transactions yet</p>
              )}
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setRecentBookingsModalOpen(true)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Recent Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {demoBookedServices.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{booking.services?.title || 'Service'}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={booking.status === 'completed' ? 'default' : 'secondary'}>
                    {booking.status}
                  </Badge>
                </div>
              ))}
              {demoBookedServices.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No bookings yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <DashboardModals
        balanceModalOpen={balanceModalOpen}
        setBalanceModalOpen={setBalanceModalOpen}
        spentModalOpen={spentModalOpen}
        setSpentModalOpen={setSpentModalOpen}
        servicesModalOpen={servicesModalOpen}
        setServicesModalOpen={setServicesModalOpen}
        completionModalOpen={completionModalOpen}
        setCompletionModalOpen={setCompletionModalOpen}
        upcomingModalOpen={upcomingModalOpen}
        setUpcomingModalOpen={setUpcomingModalOpen}
        recentTransactionsModalOpen={recentTransactionsModalOpen}
        setRecentTransactionsModalOpen={setRecentTransactionsModalOpen}
        recentBookingsModalOpen={recentBookingsModalOpen}
        setRecentBookingsModalOpen={setRecentBookingsModalOpen}
        topUpModalOpen={topUpModalOpen}
        setTopUpModalOpen={setTopUpModalOpen}
        allTransactions={allTransactions}
        spentTransactions={spentTransactions}
        bookedServices={bookedServices}
        upcomingBookings={upcomingBookings}
        userStats={userStats}
        onTopUpSuccess={(amount, showSuccessModal) => {
          refreshData();
          fetchConsultantData(); // Also refresh local dashboard data
          if (showSuccessModal) {
            setSuccessModalData({ type: "top-up", amount });
            setSuccessModalOpen(true);
          }
        }}
      />
      
      <SuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        type={successModalData.type}
        amount={successModalData.amount}
      />
    </div>
  );
}
