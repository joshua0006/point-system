import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp,
  Calendar,
  CheckCircle,
  Wallet,
  Users
} from "lucide-react";
import { DashboardModals } from "./DashboardModals";
import { useDashboardData } from "@/hooks/useDashboardData";

interface BuyerDashboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BuyerDashboardModal({ open, onOpenChange }: BuyerDashboardModalProps) {
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

  // Demo buyer profile data
  const [consultantProfile, setConsultantProfile] = useState({
    name: "",
    tier: "bronze" as "bronze" | "silver" | "gold" | "platinum",
    totalEarnings: 0,
    totalSpendings: 0,
    totalSessions: 0,
    totalPurchases: 0,
    completionRate: 0,
    pointsBalance: 0
  });

  const [transactions, setTransactions] = useState([
    {
      id: "1",
      type: "earned",
      description: "Initial Welcome Bonus",
      amount: 1000,
      created_at: "2024-01-15T10:00:00Z"
    },
    {
      id: "2", 
      type: "spent",
      description: "Business Strategy Consultation",
      amount: -150,
      created_at: "2024-01-20T14:30:00Z"
    },
    {
      id: "3",
      type: "earned",
      description: "Referral Bonus",
      amount: 50,
      created_at: "2024-01-25T09:15:00Z"
    },
    {
      id: "4",
      type: "spent", 
      description: "Marketing Analysis Session",
      amount: -200,
      created_at: "2024-02-01T11:00:00Z"
    },
    {
      id: "5",
      type: "earned",
      description: "Monthly Cashback",
      amount: 75,
      created_at: "2024-02-10T16:45:00Z"
    }
  ]);

  const [demoBookedServices, setDemoBookedServices] = useState([
    {
      id: "1",
      service: "Business Strategy Consultation",
      status: "completed" as 'pending' | 'confirmed' | 'completed' | 'cancelled',
      date: "2024-01-20",
      consultant: "Dr. Sarah Wilson",
      points: 150
    },
    {
      id: "2", 
      service: "Marketing Analysis Session",
      status: "completed" as 'pending' | 'confirmed' | 'completed' | 'cancelled',
      date: "2024-02-01",
      consultant: "Mark Thompson",
      points: 200
    },
    {
      id: "3",
      service: "Financial Planning Review",
      status: "pending" as 'pending' | 'confirmed' | 'completed' | 'cancelled',
      date: "2024-02-15",
      consultant: "Lisa Chen",
      points: 175
    },
    {
      id: "4",
      service: "Product Launch Strategy",
      status: "confirmed" as 'pending' | 'confirmed' | 'completed' | 'cancelled',
      date: "2024-02-20",
      consultant: "James Rodriguez",
      points: 250
    }
  ]);

  useEffect(() => {
    const fetchConsultantData = async () => {
      if (!user) return;

      try {
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
          completionRate: 92, // Their completion rate for booked sessions
          pointsBalance: profile?.points_balance || 1125
        });
      } catch (error) {
        console.error('Error fetching consultant data:', error);
      }
    };

    if (user) {
      fetchConsultantData();
    }
  }, [user]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Buyer Dashboard
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        <p className="font-medium">{booking.service || 'Service'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(booking.date).toLocaleDateString()}
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
        </DialogContent>
      </Dialog>

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
    </>
  );
}