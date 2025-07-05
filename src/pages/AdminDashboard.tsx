import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TierBadge } from "@/components/TierBadge";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Activity,
  UserCheck,
  Star,
  ArrowUpDown
} from "lucide-react";

export default function AdminDashboard() {
  // Mock admin data
  const platformStats = {
    totalUsers: 1247,
    totalConsultants: 89,
    totalServices: 156,
    totalTransactions: 3421,
    monthlyVolume: 125000,
    activeBookings: 34
  };

  const topConsultants = [
    {
      id: "1",
      name: "Sarah Chen",
      tier: "platinum" as const,
      earnings: 15750,
      sessions: 42,
      rating: 4.8
    },
    {
      id: "2", 
      name: "Marcus Rodriguez",
      tier: "gold" as const,
      earnings: 12300,
      sessions: 35,
      rating: 4.7
    },
    {
      id: "3",
      name: "Emily Johnson", 
      tier: "silver" as const,
      earnings: 8900,
      sessions: 28,
      rating: 4.6
    },
  ];

  const recentActivity = [
    {
      id: "1",
      type: "booking",
      description: "John D. booked Strategic Consultation with Sarah Chen",
      points: 500,
      timestamp: "2 hours ago"
    },
    {
      id: "2",
      type: "service",
      description: "Marcus Rodriguez added new Tech Review service",
      points: 0,
      timestamp: "4 hours ago"
    },
    {
      id: "3",
      type: "completion",
      description: "Marketing session completed by Emily Johnson",  
      points: 275,
      timestamp: "6 hours ago"
    },
    {
      id: "4",
      type: "registration",
      description: "New consultant Lisa Thompson registered (Bronze tier)",
      points: 0,
      timestamp: "1 day ago"
    },
  ];

  const pendingApprovals = [
    {
      id: "1",
      type: "service",
      consultant: "David Kim",
      title: "Advanced Financial Modeling",
      category: "Finance",
      points: 600
    },
    {
      id: "2",
      type: "tier_upgrade",
      consultant: "Lisa Thompson",
      currentTier: "bronze",
      requestedTier: "silver"
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor platform performance and manage consultants
          </p>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Total Users
                <Users className="w-4 h-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{platformStats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Active Consultants
                <UserCheck className="w-4 h-4 text-success" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{platformStats.totalConsultants}</div>
              <p className="text-xs text-muted-foreground">{platformStats.totalServices} services listed</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent to-accent/80 text-accent-foreground">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Monthly Volume
                <DollarSign className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats.monthlyVolume.toLocaleString()}</div>
              <p className="text-xs opacity-90">points transacted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Active Bookings
                <Calendar className="w-4 h-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{platformStats.activeBookings}</div>
              <p className="text-xs text-muted-foreground">sessions this week</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Consultants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="w-5 h-5" />
                <span>Top Consultants</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topConsultants.map((consultant, index) => (
                  <div key={consultant.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-sm text-foreground">{consultant.name}</p>
                          <TierBadge tier={consultant.tier} size="sm" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {consultant.sessions} sessions • {consultant.rating} rating
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-accent">{consultant.earnings.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      activity.type === 'booking' ? 'bg-primary' :
                      activity.type === 'service' ? 'bg-success' :
                      activity.type === 'completion' ? 'bg-accent' : 'bg-muted-foreground'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{activity.description}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                        {activity.points > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {activity.points} pts
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ArrowUpDown className="w-5 h-5" />
                <span>Pending Approvals</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApprovals.map((item) => (
                  <div key={item.id} className="p-4 rounded-lg border bg-card">
                    {item.type === 'service' ? (
                      <>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">{item.title}</h4>
                            <p className="text-xs text-muted-foreground">by {item.consultant}</p>
                          </div>
                          <Badge variant="secondary">{item.category}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-accent">{item.points} points</span>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">Reject</Button>
                            <Button size="sm">Approve</Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mb-3">
                          <h4 className="font-semibold text-sm text-foreground">Tier Upgrade Request</h4>
                          <p className="text-xs text-muted-foreground">{item.consultant}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <TierBadge tier={item.currentTier as any} size="sm" />
                            <span className="text-xs text-muted-foreground">→</span>
                            <TierBadge tier={item.requestedTier as any} size="sm" />
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">Reject</Button>
                            <Button size="sm">Approve</Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}