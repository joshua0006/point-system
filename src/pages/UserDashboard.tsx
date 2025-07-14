
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { DashboardModals } from "@/components/dashboard/DashboardModals";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
  TrendingUp,
  Calendar,
  CheckCircle,
  Wallet,
  Users
} from "lucide-react";

export default function UserDashboard() {
  const { user } = useAuth();
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
    userStats,
    allTransactions,
    spentTransactions,
    bookedServices,
    upcomingBookings,
    recentTransactions,
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
  }, [user]);

  const fetchConsultantData = async () => {
    try {
      console.log('Fetching consultant data for user:', user?.id);
      
      // Fetch consultant profile
      const { data: consultant, error: consultantError } = await supabase
        .from('consultants')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      console.log('Consultant data:', consultant, 'Error:', consultantError);

      // Fetch user profile for points balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      console.log('Profile data:', profile, 'Error:', profileError);

      // Always set demo data for the buyer dashboard
      setConsultantProfile({
        name: profile?.full_name || "Professional Buyer",
        tier: "bronze",
        totalEarnings: 750, // As a buyer, this would be rewards/cashback
        totalSpendings: 2850,
        totalSessions: 8, // Sessions they've booked
        totalPurchases: 8,
        pointsBalance: profile?.points_balance || 1850,
        completionRate: 95, // Rate of completed bookings
        totalServices: 0
      });

      // Create demo transaction data
      const demoTransactions = [
        {
          id: 'trans-1',
          type: 'purchase',
          amount: -500,
          description: 'Business Strategy Consultation',
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'trans-2',
          type: 'admin_credit',
          amount: 200,
          description: 'Welcome bonus points',
          created_at: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: 'trans-3',
          type: 'purchase',
          amount: -300,
          description: 'Marketing Analysis Session',
          created_at: new Date(Date.now() - 259200000).toISOString()
        },
        {
          id: 'trans-4',
          type: 'earning',
          amount: 150,
          description: 'Referral bonus',
          created_at: new Date(Date.now() - 345600000).toISOString()
        },
        {
          id: 'trans-5',
          type: 'purchase',
          amount: -450,
          description: 'Technology Roadmap Consultation',
          created_at: new Date(Date.now() - 432000000).toISOString()
        }
      ];

      // Create demo booking data
      const demoBookings = [
        {
          id: 'booking-1',
          status: 'completed',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          services: { title: 'Business Strategy Consultation', price: 500 },
          points_spent: 500
        },
        {
          id: 'booking-2',
          status: 'completed',
          created_at: new Date(Date.now() - 259200000).toISOString(),
          services: { title: 'Marketing Analysis', price: 300 },
          points_spent: 300
        },
        {
          id: 'booking-3',
          status: 'completed',
          created_at: new Date(Date.now() - 432000000).toISOString(),
          services: { title: 'Technology Roadmap', price: 450 },
          points_spent: 450
        },
        {
          id: 'booking-4',
          status: 'confirmed',
          created_at: new Date(Date.now() - 518400000).toISOString(),
          services: { title: 'Digital Transformation Planning', price: 600 },
          points_spent: 600
        },
        {
          id: 'booking-5',
          status: 'completed',
          created_at: new Date(Date.now() - 604800000).toISOString(),
          services: { title: 'Operations Optimization', price: 400 },
          points_spent: 400
        }
      ];

      setTransactions(demoTransactions);
      setDemoBookedServices(demoBookings);

    } catch (error) {
      console.error('Error fetching consultant data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            My Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your points, bookings, and consultation history
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setBalanceModalOpen(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Points Balance
                <Wallet className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{consultantProfile.pointsBalance.toLocaleString()}</div>
              <p className="text-xs opacity-90">available points</p>
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
              <p className="text-xs text-muted-foreground">points spent</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
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
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount} pts
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No transactions yet</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
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
        allTransactions={allTransactions}
        spentTransactions={spentTransactions}
        bookedServices={bookedServices}
        upcomingBookings={upcomingBookings}
        userStats={userStats}
      />
    </div>
  );
}
