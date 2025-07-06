
import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Calendar, 
  User, 
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowUpDown
} from "lucide-react";

// Import the modal components
import { BalanceDetailsModal } from "@/components/dashboard/BalanceDetailsModal";
import { SpentDetailsModal } from "@/components/dashboard/SpentDetailsModal";
import { ServicesBookedModal } from "@/components/dashboard/ServicesBookedModal";
import { CompletionRateModal } from "@/components/dashboard/CompletionRateModal";
import { UpcomingSessionsModal } from "@/components/dashboard/UpcomingSessionsModal";

export default function UserDashboard() {
  // Modal states
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [spentModalOpen, setSpentModalOpen] = useState(false);
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [upcomingModalOpen, setUpcomingModalOpen] = useState(false);

  // Mock data
  const userStats = {
    totalPoints: 2450,
    pointsSpent: 1200,
    pointsEarned: 3650,
    servicesBooked: 8,
    completedSessions: 6,
  };

  const allTransactions = [
    {
      id: "1",
      type: "spent" as const,
      service: "Strategic Business Consultation",
      consultant: "Sarah Chen",
      points: 500,
      date: "2024-01-15",
      status: "completed"
    },
    {
      id: "2", 
      type: "earned" as const,
      service: "Monthly Bonus",
      points: 200,
      date: "2024-01-01",
      status: "completed"
    },
    {
      id: "3",
      type: "spent" as const,
      service: "Technical Architecture Review",
      consultant: "Marcus Rodriguez", 
      points: 350,
      date: "2024-01-10",
      status: "completed"
    },
    {
      id: "4",
      type: "earned" as const,
      service: "Welcome Bonus",
      points: 1000,
      date: "2023-12-15",
      status: "completed"
    },
    {
      id: "5",
      type: "spent" as const,
      service: "Marketing Strategy Session",
      consultant: "Emily Johnson",
      points: 300,
      date: "2024-01-05",
      status: "completed"
    },
  ];

  const spentTransactions = allTransactions.filter(t => t.type === 'spent').map(t => ({
    ...t,
    duration: t.points > 400 ? "1 hour" : "30 mins"
  }));

  const bookedServices = [
    {
      id: "1",
      service: "Strategic Business Consultation",
      consultant: "Sarah Chen",
      date: "2024-01-15",
      time: "2:00 PM",
      duration: "1 hour",
      status: "completed" as const,
      points: 500
    },
    {
      id: "2",
      service: "Technical Architecture Review",
      consultant: "Marcus Rodriguez",
      date: "2024-01-10",
      time: "10:00 AM",
      duration: "45 mins",
      status: "completed" as const,
      points: 350
    },
    {
      id: "3",
      service: "Marketing Strategy Session",
      consultant: "Emily Johnson",
      date: "2024-01-05",
      time: "3:00 PM",
      duration: "30 mins",
      status: "completed" as const,
      points: 300
    },
    {
      id: "4",
      service: "Financial Planning",
      consultant: "David Kim",
      date: "2024-01-02",
      time: "11:00 AM",
      duration: "1 hour",
      status: "completed" as const,
      points: 400
    },
    {
      id: "5",
      service: "Legal Consultation",
      consultant: "Jennifer Liu",
      date: "2023-12-28",
      time: "4:00 PM",
      duration: "30 mins",
      status: "completed" as const,
      points: 250
    },
    {
      id: "6",
      service: "Product Strategy",
      consultant: "Alex Turner",
      date: "2023-12-25",
      time: "1:00 PM",
      duration: "45 mins",
      status: "completed" as const,
      points: 375
    },
    {
      id: "7",
      service: "HR Consultation",
      consultant: "Maria Garcia",
      date: "2024-01-22",
      time: "9:00 AM",
      duration: "30 mins",
      status: "pending" as const,
      points: 275
    },
    {
      id: "8",
      service: "Technology Audit",
      consultant: "Robert Chen",
      date: "2024-01-18",
      time: "2:30 PM",
      duration: "1.5 hours",
      status: "confirmed" as const,
      points: 600
    },
  ];

  const upcomingBookings = [
    {
      id: "1",
      service: "Marketing Campaign Analysis",
      consultant: "Emily Johnson",
      date: "2024-01-20",
      time: "2:00 PM",
      duration: "30 mins",
      bookingUrl: "https://calendly.com/emily-johnson/marketing",
      status: "confirmed" as const
    },
    {
      id: "2",
      service: "Financial Planning & Budgeting", 
      consultant: "David Kim",
      date: "2024-01-25",
      time: "10:00 AM",
      duration: "1 hour",
      bookingUrl: "https://calendly.com/david-kim/finance",
      status: "pending" as const
    },
    {
      id: "3",
      service: "Product Roadmap Review",
      consultant: "Alex Turner",
      date: "2024-01-28",
      time: "3:00 PM",
      duration: "45 mins",
      bookingUrl: "https://calendly.com/alex-turner/product",
      status: "confirmed" as const
    },
  ];

  const recentTransactions = allTransactions.slice(0, 3);

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
            className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setBalanceModalOpen(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Current Balance
                <Wallet className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.totalPoints.toLocaleString()}</div>
              <p className="text-xs opacity-90">points available</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:scale-105 transition-transform"
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
              <p className="text-xs text-muted-foreground">points this month</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:scale-105 transition-transform"
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
              <p className="text-xs text-muted-foreground">sessions total</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:scale-105 transition-transform"
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
                {Math.round((userStats.completedSessions / userStats.servicesBooked) * 100)}%
              </div>
              <Progress 
                value={(userStats.completedSessions / userStats.servicesBooked) * 100} 
                className="mt-2" 
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Transactions */}
          <Card className="cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => setBalanceModalOpen(true)}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ArrowUpDown className="w-5 h-5" />
                <span>Recent Transactions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        transaction.type === 'spent' 
                          ? 'bg-destructive/10 text-destructive' 
                          : 'bg-success/10 text-success'
                      }`}>
                        {transaction.type === 'spent' ? (
                          <TrendingUp className="w-4 h-4 rotate-45" />
                        ) : (
                          <TrendingUp className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{transaction.service}</p>
                        {transaction.consultant && (
                          <p className="text-xs text-muted-foreground">with {transaction.consultant}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{transaction.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'spent' ? 'text-destructive' : 'text-success'
                      }`}>
                        {transaction.type === 'spent' ? '-' : '+'}{transaction.points}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Bookings */}
          <Card className="cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => setUpcomingModalOpen(true)}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Upcoming Sessions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingBookings.slice(0, 2).map((booking) => (
                  <div key={booking.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-foreground">{booking.service}</h4>
                        <p className="text-sm text-muted-foreground">with {booking.consultant}</p>
                      </div>
                      <Badge variant="outline">{booking.duration}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{booking.date}</span>
                        <span>{booking.time}</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(booking.bookingUrl, '_blank');
                        }}
                      >
                        Join Session
                      </Button>
                    </div>
                  </div>
                ))}
                
                {upcomingBookings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No upcoming sessions</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <BalanceDetailsModal 
        open={balanceModalOpen}
        onOpenChange={setBalanceModalOpen}
        transactions={allTransactions}
      />
      
      <SpentDetailsModal
        open={spentModalOpen}
        onOpenChange={setSpentModalOpen}
        spentTransactions={spentTransactions}
      />
      
      <ServicesBookedModal
        open={servicesModalOpen}
        onOpenChange={setServicesModalOpen}
        bookedServices={bookedServices}
      />
      
      <CompletionRateModal
        open={completionModalOpen}
        onOpenChange={setCompletionModalOpen}
        services={bookedServices}
        overallRate={Math.round((userStats.completedSessions / userStats.servicesBooked) * 100)}
      />
      
      <UpcomingSessionsModal
        open={upcomingModalOpen}
        onOpenChange={setUpcomingModalOpen}
        sessions={upcomingBookings}
      />
    </div>
  );
}
