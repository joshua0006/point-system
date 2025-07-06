
import { Navigation } from "@/components/Navigation";
import { useDashboardData } from "@/hooks/useDashboardData";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { UpcomingSessions } from "@/components/dashboard/UpcomingSessions";
import { DashboardModals } from "@/components/dashboard/DashboardModals";

export default function UserDashboard() {
  const {
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
    
    // Data
    userStats,
    allTransactions,
    spentTransactions,
    bookedServices,
    upcomingBookings,
    recentTransactions,
  } = useDashboardData();

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
        <DashboardStats
          userStats={userStats}
          onBalanceClick={() => setBalanceModalOpen(true)}
          onSpentClick={() => setSpentModalOpen(true)}
          onServicesClick={() => setServicesModalOpen(true)}
          onCompletionClick={() => setCompletionModalOpen(true)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentTransactions 
            transactions={recentTransactions}
            onClick={() => setBalanceModalOpen(true)}
          />
          
          <UpcomingSessions 
            sessions={upcomingBookings}
            onClick={() => setUpcomingModalOpen(true)}
          />
        </div>
      </div>

      {/* Modals */}
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
