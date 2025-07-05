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

export default function UserDashboard() {
  // Mock data
  const userStats = {
    totalPoints: 2450,
    pointsSpent: 1200,
    pointsEarned: 3650,
    servicesBooked: 8,
    completedSessions: 6,
  };

  const recentTransactions = [
    {
      id: "1",
      type: "spent",
      service: "Strategic Business Consultation",
      consultant: "Sarah Chen",
      points: 500,
      date: "2024-01-15",
      status: "completed"
    },
    {
      id: "2", 
      type: "earned",
      service: "Monthly Bonus",
      points: 200,
      date: "2024-01-01",
      status: "completed"
    },
    {
      id: "3",
      type: "spent",
      service: "Technical Architecture Review",
      consultant: "Marcus Rodriguez", 
      points: 350,
      date: "2024-01-10",
      status: "completed"
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
      bookingUrl: "https://calendly.com/emily-johnson/marketing"
    },
    {
      id: "2",
      service: "Financial Planning & Budgeting", 
      consultant: "David Kim",
      date: "2024-01-25",
      time: "10:00 AM",
      duration: "1 hour",
      bookingUrl: "https://calendly.com/david-kim/finance"
    },
  ];

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
                Current Balance
                <Wallet className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.totalPoints.toLocaleString()}</div>
              <p className="text-xs opacity-90">points available</p>
            </CardContent>
          </Card>

          <Card>
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

          <Card>
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

          <Card>
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
          <Card>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Upcoming Sessions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
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
                        onClick={() => window.open(booking.bookingUrl, '_blank')}
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
    </div>
  );
}