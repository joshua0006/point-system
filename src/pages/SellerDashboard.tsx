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
  ExternalLink,
  BarChart3,
  MessageCircle
} from "lucide-react";

export default function SellerDashboard() {
  const { toast } = useToast();
  const [showAddService, setShowAddService] = useState(false);

  // Mock seller data with enhanced metrics
  const sellerStats = {
    totalEarnings: 15750,
    monthlyEarnings: 3200,
    totalOrders: 42,
    activeServices: 6,
    rating: 4.8,
    responseRate: 98,
    conversionRate: 24,
    tier: "platinum" as const
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
      orders: 12,
      revenue: 6000,
      views: 245,
      inquiries: 18
    },
    {
      id: "2",
      title: "Growth Strategy Workshop",
      category: "Strategy", 
      points: 350,
      duration: "45 mins",
      bookingUrl: "https://calendly.com/sarah-chen/growth",
      status: "active",
      orders: 8,
      revenue: 2800,
      views: 156,
      inquiries: 12
    },
  ];

  const recentOrders = [
    {
      id: "1",
      service: "Strategic Business Consultation",
      buyer: "John D.",
      date: "2024-01-18",
      status: "completed",
      points: 500
    },
    {
      id: "2",
      service: "Growth Strategy Workshop",
      buyer: "Maria S.",
      date: "2024-01-19", 
      status: "in_progress",
      points: 350
    },
    {
      id: "3",
      service: "Strategic Business Consultation",
      buyer: "Alex K.",
      date: "2024-01-20", 
      status: "pending",
      points: 500
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
                Seller Dashboard
              </h1>
              <TierBadge tier={sellerStats.tier} />
            </div>
            <p className="text-muted-foreground">
              Manage your services, track earnings, and grow your business
            </p>
          </div>
          <Button onClick={() => setShowAddService(true)} className="bg-success hover:bg-success/90">
            <Plus className="w-4 h-4 mr-2" />
            Create Service
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-success to-success/80 text-success-foreground">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Monthly Earnings
                <DollarSign className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sellerStats.monthlyEarnings.toLocaleString()}</div>
              <p className="text-xs opacity-90">points this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Active Orders
                <Users className="w-4 h-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{sellerStats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">total completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Success Rate
                <TrendingUp className="w-4 h-4 text-success" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{sellerStats.rating}</div>
              <p className="text-xs text-muted-foreground">average rating</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Conversion Rate
                <BarChart3 className="w-4 h-4 text-accent" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{sellerStats.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">inquiries to orders</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Services - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>My Services</span>
                  <Badge variant="secondary">{myServices.length} active</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myServices.map((service) => (
                    <div key={service.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{service.title}</h4>
                          <div className="flex items-center space-x-2 mt-1 mb-2">
                            <Badge variant="secondary">{service.category}</Badge>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{service.duration}</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Revenue:</span>
                              <div className="font-semibold text-success">{service.revenue.toLocaleString()} pts</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Orders:</span>
                              <div className="font-semibold">{service.orders}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Views:</span>
                              <div className="font-semibold">{service.views}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Inquiries:</span>
                              <div className="font-semibold">{service.inquiries}</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <BarChart3 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center space-x-4">
                          <span className="font-semibold text-accent">{service.points} points</span>
                          <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                            {service.status}
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => window.open(service.bookingUrl, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Calendar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders - Takes 1 column */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Recent Orders</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="font-medium text-sm text-foreground">{order.service}</h5>
                        <p className="text-xs text-muted-foreground">from {order.buyer}</p>
                      </div>
                      <Badge 
                        variant={
                          order.status === 'completed' ? 'default' : 
                          order.status === 'in_progress' ? 'secondary' : 'outline'
                        }
                        className="text-xs"
                      >
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{order.date}</span>
                      <span className="font-semibold text-success">{order.points} pts</span>
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
                <CardTitle>Create New Service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Service Title</label>
                    <Input placeholder="Enter service title" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea placeholder="Describe your service offering" />
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
                    <Button onClick={handleAddService} className="bg-success hover:bg-success/90">
                      Create Service
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