
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { DashboardModals } from "@/components/dashboard/DashboardModals";
import { useDashboardData } from "@/hooks/useDashboardData";
import { SuccessModal } from "@/components/SuccessModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { SubscriptionStatusCard } from "@/components/SubscriptionStatusCard";
import { DashboardSkeleton } from "@/components/PageSkeleton";
import { WalletDrawer } from "@/components/wallet/WalletDrawer";
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
    upcomingChargesModalOpen,
    setUpcomingChargesModalOpen,
    userStats,
    allTransactions,
    spentTransactions,
    bookedServices,
    upcomingBookings,
    recentTransactions,
    refreshData,
    isLoading,
  } = useDashboardData();
  
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{ type: "payment-method" | "top-up", amount?: number }>({ type: "top-up" });

  // Show loading skeleton while data is being fetched
  if (isLoading || !user) {
    return <DashboardSkeleton />;
  }

  // Real-time subscriptions are now handled in useDashboardData hook

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

        {/* Subscription Status */}
        <div className={isMobile ? "mb-6" : "mb-8"}>
          <SubscriptionStatusCard compact={isMobile} />
        </div>


        {/* Stats Cards */}
        <div className={isMobile ? "grid grid-cols-1 gap-4 mb-6" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"}>
          <WalletDrawer>
            <Card className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                  Flexi-Credits Balance
                  <Wallet className="w-4 h-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${userStats.totalPoints < 0 ? 'text-red-200' : ''}`}>
                  {userStats.totalPoints < 0 ? 'Owes ' : ''}{Math.abs(userStats.totalPoints).toLocaleString()}{userStats.totalPoints < 0 ? ' pts' : ''}
                </div>
                <p className="text-xs opacity-90">
                  {userStats.totalPoints < 0 ? 'flexi-credits owed' : 'available flexi-credits'}
                </p>
              </CardContent>
            </Card>
          </WalletDrawer>

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
              <div className="text-2xl font-bold text-foreground">{userStats.pointsSpent.toLocaleString()}</div>
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
              <div className="text-2xl font-bold text-foreground">{userStats.servicesBooked}</div>
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
                {userStats.servicesBooked > 0 ? Math.round((userStats.completedSessions / userStats.servicesBooked) * 100) : 0}%
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
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{transaction.service}</p>
                    <p className="text-sm text-muted-foreground">{transaction.date}</p>
                  </div>
                  <div className={`font-semibold ${transaction.type === 'earned' ? 'text-success' : 'text-destructive'}`}>
                    {transaction.type === 'earned' ? '+' : '-'}{transaction.points} credits
                  </div>
                </div>
              ))}
              {recentTransactions.length === 0 && (
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
              {bookedServices.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{booking.service}</p>
                    <p className="text-sm text-muted-foreground">{booking.date}</p>
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
        upcomingChargesModalOpen={upcomingChargesModalOpen}
        setUpcomingChargesModalOpen={setUpcomingChargesModalOpen}
        allTransactions={allTransactions}
        spentTransactions={spentTransactions}
        bookedServices={bookedServices}
        upcomingBookings={upcomingBookings}
        userStats={userStats}
        onTopUpSuccess={(amount, showSuccessModal) => {
          refreshData();
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
