
import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TierBadge } from "@/components/TierBadge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  Calendar,
  CheckCircle,
  Wallet,
  Target,
  Users
} from "lucide-react";

export default function UserDashboard() {
  const { user } = useAuth();
  
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
  const [bookedServices, setBookedServices] = useState<any[]>([]);

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

      // Fetch transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      console.log('Transaction data:', transactionData, 'Error:', transactionError);

      // Fetch bookings as consultant (only if user is a consultant)
      let consultantBookings = [];
      if (consultant?.id) {
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select(`
            *,
            services(title, price),
            profiles!bookings_user_id_fkey(full_name, email)
          `)
          .eq('consultant_id', consultant.id);
        consultantBookings = bookingsData || [];
      }

      // Fetch bookings as user
      const { data: userBookings } = await supabase
        .from('bookings')
        .select(`
          *,
          services(title, price),
          consultants!inner(user_id, profiles!consultants_user_id_fkey(full_name, email))
        `)
        .eq('user_id', user?.id);

      // Calculate stats
      const earnings = (transactionData || [])
        .filter(t => ['earning', 'admin_credit'].includes(t.type))
        .reduce((sum, t) => sum + t.amount, 0);

      const spendings = (transactionData || [])
        .filter(t => t.type === 'purchase')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const completedBookings = consultantBookings.filter(b => b.status === 'completed').length;
      const totalBookings = consultantBookings.length;
      const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

      console.log('Calculated stats:', {
        earnings,
        spendings,
        completedBookings,
        totalBookings,
        completionRate,
        pointsBalance: profile?.points_balance
      });

      setConsultantProfile({
        name: profile?.full_name || "",
        tier: consultant?.tier || "bronze",
        totalEarnings: earnings,
        totalSpendings: spendings,
        totalSessions: consultantBookings.length,
        totalPurchases: (userBookings || []).length,
        pointsBalance: profile?.points_balance || 0,
        completionRate,
        totalServices: 0 // Will be calculated from services if needed
      });

      setTransactions(transactionData || []);
      setBookedServices([...consultantBookings, ...(userBookings || [])]);

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
          <Card className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Total Earnings
                <TrendingUp className="w-4 h-4 text-success" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{consultantProfile.totalEarnings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">points earned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Sessions Completed
                <Calendar className="w-4 h-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{consultantProfile.totalSessions}</div>
              <p className="text-xs text-muted-foreground">total sessions</p>
            </CardContent>
          </Card>

          <Card>
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
              {bookedServices.slice(0, 5).map((booking) => (
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
              {bookedServices.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No bookings yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
