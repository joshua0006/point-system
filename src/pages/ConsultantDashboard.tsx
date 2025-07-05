import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TierBadge } from "@/components/TierBadge";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  DollarSign, 
  Users, 
  Calendar,
  TrendingUp,
  Edit,
  Trash2,
  ExternalLink
} from "lucide-react";

export default function ConsultantDashboard() {
  const { toast } = useToast();
  const [showAddService, setShowAddService] = useState(false);

  // Mock consultant data
  const consultantProfile = {
    name: "Sarah Chen",
    tier: "platinum" as const,
    totalEarnings: 15750,
    totalSessions: 42,
    rating: 4.8,
    responseRate: 98
  };

  const myServices = [
    {
      id: "1",
      title: "Strategic Business Consultation",
      category: "Strategy",
      points: 500,
      duration: "1 hour",
      bookingUrl: "https://calendly.com/sarah-chen/strategy",
      status: "active",
      bookings: 12
    },
    {
      id: "2",
      title: "Growth Strategy Workshop",
      category: "Strategy", 
      points: 350,
      duration: "45 mins",
      bookingUrl: "https://calendly.com/sarah-chen/growth",
      status: "active",
      bookings: 8
    },
  ];

  const upcomingBookings = [
    {
      id: "1",
      service: "Strategic Business Consultation",
      client: "John D.",
      date: "2024-01-20",
      time: "2:00 PM",
      points: 500
    },
    {
      id: "2",
      service: "Growth Strategy Workshop",
      client: "Maria S.",
      date: "2024-01-22", 
      time: "10:00 AM",
      points: 350
    },
  ];

  const handleAddService = () => {
    toast({
      title: "Service Added",
      description: "Your new service has been added to the marketplace.",
    });
    setShowAddService(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">
                Consultant Dashboard
              </h1>
              <TierBadge tier={consultantProfile.tier} />
            </div>
            <p className="text-muted-foreground">
              Manage your services and track your performance
            </p>
          </div>
          <Button onClick={() => setShowAddService(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-accent to-accent/80 text-accent-foreground">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Total Earnings
                <DollarSign className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{consultantProfile.totalEarnings.toLocaleString()}</div>
              <p className="text-xs opacity-90">points earned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Total Sessions
                <Users className="w-4 h-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{consultantProfile.totalSessions}</div>
              <p className="text-xs text-muted-foreground">completed sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Average Rating
                <TrendingUp className="w-4 h-4 text-success" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{consultantProfile.rating}</div>
              <p className="text-xs text-muted-foreground">out of 5.0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Response Rate
                <Calendar className="w-4 h-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{consultantProfile.responseRate}%</div>
              <p className="text-xs text-muted-foreground">within 24 hours</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Services */}
          <Card>
            <CardHeader>
              <CardTitle>My Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myServices.map((service) => (
                  <div key={service.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-foreground">{service.title}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary">{service.category}</Badge>
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{service.duration}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="font-semibold text-accent">{service.points} points</span>
                        <span className="text-muted-foreground">{service.bookings} bookings</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => window.open(service.bookingUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Calendly
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-foreground">{booking.service}</h4>
                        <p className="text-sm text-muted-foreground">with {booking.client}</p>
                      </div>
                      <Badge variant="outline">{booking.points} pts</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{booking.date}</span>
                        <span>{booking.time}</span>
                      </div>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Service Modal */}
        {showAddService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Add New Service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Service Title</label>
                    <Input placeholder="Enter service title" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea placeholder="Describe your service" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="strategy">Strategy</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="career">Career</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Points</label>
                      <Input type="number" placeholder="350" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Booking URL</label>
                    <Input placeholder="https://calendly.com/your-link" />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setShowAddService(false)}>
                      Cancel
                    </Button>  
                    <Button onClick={handleAddService}>
                      Add Service
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}