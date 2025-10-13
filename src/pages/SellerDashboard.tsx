import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TierBadge } from "@/components/TierBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ServiceForm } from "@/components/forms/ServiceForm";
import { EarningsModal } from "@/components/dashboard/EarningsModal";
import { RecentOrdersModal } from "@/components/dashboard/RecentOrdersModal";
import { ServicesDetailsModal } from "@/components/dashboard/ServicesDetailsModal";
import { PerformanceModal } from "@/components/dashboard/PerformanceModal";
import { BuyerReviewsModal } from "@/components/dashboard/BuyerReviewsModal";
import { UpcomingSessionsModal } from "@/components/dashboard/UpcomingSessionsModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useConsultantServices, useCreateService, useUpdateService, useDeleteService } from "@/hooks/useServiceOperations";
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
  MessageCircle,
  Star,
  Clock
} from "lucide-react";

type TimeScale = "lifetime" | "yearly" | "monthly";

export default function SellerDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showAddService, setShowAddService] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  
  // Modal states
  const [earningsModalOpen, setEarningsModalOpen] = useState(false);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  const [performanceModalOpen, setPerformanceModalOpen] = useState(false);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [upcomingSessionsModalOpen, setUpcomingSessionsModalOpen] = useState(false);
  
  // Persistent earnings filter state
  const [currentEarningsFilter, setCurrentEarningsFilter] = useState<TimeScale>("lifetime");
  
  const { data: services, isLoading: servicesLoading } = useConsultantServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  // Calculate stats from real services
  const totalServices = services?.length || 0;
  const activeServices = services?.filter(s => s.is_active).length || 0;
  const monthlyEarnings = services?.reduce((sum, s) => sum + (s.price * 3), 0) || 0; // Mock earnings
  const totalRevenue = services?.reduce((sum, s) => sum + (s.price * 8), 0) || 0; // Mock total revenue
  
  // Mock earnings data for different time scales
  const mockEarningsData = {
    lifetime: totalRevenue,
    yearly: Math.round(totalRevenue * 0.7),
    monthly: Math.round(totalRevenue * 0.1),
  };
  
  const myServices = services || [];

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

  // Calculate total lifetime orders (including mock data for demonstration)
  const lifetimeOrders = recentOrders.length + 15; // Adding mock historical orders

  // Mock buyer reviews data
  const buyerReviews = [
    {
      id: "1",
      buyer: "John D.",
      service: "Strategic Business Consultation",
      rating: 5,
      comment: "Excellent consultation! Very insightful and actionable advice.",
      date: "2024-01-18"
    },
    {
      id: "2",
      buyer: "Maria S.",
      service: "Growth Strategy Workshop",
      rating: 4,
      comment: "Great session, learned a lot about scaling strategies.",
      date: "2024-01-19"
    },
    {
      id: "3",
      buyer: "Alex K.",
      service: "Strategic Business Consultation",
      rating: 5,
      comment: "Phenomenal insights! Will definitely book again.",
      date: "2024-01-20"
    },
  ];

  // Mock upcoming sessions data
  const upcomingSessions = [
    {
      id: "1",
      service: "Strategic Business Consultation",
      consultant: "You",
      date: "2024-01-25",
      time: "2:00 PM",
      duration: "60 mins",
      bookingUrl: "#",
      status: "confirmed" as const
    },
    {
      id: "2",
      service: "Growth Strategy Workshop",
      consultant: "You",
      date: "2024-01-26",
      time: "10:00 AM",
      duration: "90 mins",
      bookingUrl: "#",
      status: "confirmed" as const
    },
    {
      id: "3",
      service: "Strategic Business Consultation",
      consultant: "You",
      date: "2024-01-28",
      time: "3:30 PM",
      duration: "60 mins",
      bookingUrl: "#",
      status: "pending" as const
    },
  ];

  const getEarningsDisplayTitle = (filter: TimeScale) => {
    switch (filter) {
      case "lifetime":
        return "Lifetime Earnings";
      case "yearly":
        return "Yearly Earnings";
      case "monthly":
        return "Monthly Earnings";
      default:
        return "Lifetime Earnings";
    }
  };

  const handleCreateService = (serviceData: any) => {
    createService.mutate(serviceData, {
      onSuccess: () => {
        setShowAddService(false);
      }
    });
  };

  const handleUpdateService = (serviceData: any) => {
    if (editingService) {
      updateService.mutate(
        { id: editingService.id, updates: serviceData },
        {
          onSuccess: () => {
            setEditingService(null);
          }
        }
      );
    }
  };

  const handleDeleteService = (serviceId: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      deleteService.mutate(serviceId);
    }
  };

  const handleEarningsModalClose = (newFilter: TimeScale) => {
    setCurrentEarningsFilter(newFilter);
    setEarningsModalOpen(false);
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
                <TierBadge tier="platinum" />
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
          <Card 
            className="bg-gradient-to-br from-success to-success/80 text-success-foreground cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setEarningsModalOpen(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                {getEarningsDisplayTitle(currentEarningsFilter)}
                <DollarSign className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockEarningsData[currentEarningsFilter].toLocaleString()}</div>
              <p className="text-xs opacity-90">total points earned</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setOrdersModalOpen(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Lifetime Orders
                <Users className="w-4 h-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{lifetimeOrders}</div>
              <p className="text-xs text-muted-foreground">total orders completed</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setPerformanceModalOpen(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Performance
                <TrendingUp className="w-4 h-4 text-success" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rating:</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-accent fill-current" />
                    <span className="text-sm font-semibold">4.8</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Conversion:</span>
                  <span className="text-sm font-semibold">85%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setReviewsModalOpen(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Buyer Reviews
                <MessageCircle className="w-4 h-4 text-accent" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{buyerReviews.length + 3}</div>
              <p className="text-xs text-muted-foreground">total reviews</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Services - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle 
                  className="flex items-center justify-between cursor-pointer hover:text-primary transition-colors"
                  onClick={() => setServicesModalOpen(true)}
                >
                  <span>My Services</span>
                  <Badge variant="secondary">{myServices.length} active</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {servicesLoading ? (
                  <div className="text-center py-8">Loading services...</div>
                ) : myServices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No services created yet. Click "Create Service" to get started.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myServices.slice(0, 3).map((service) => (
                      <div key={service.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{service.title}</h4>
                            <div className="flex items-center space-x-2 mt-1 mb-2">
                              <Badge variant="secondary">{service.categories?.name || 'Uncategorized'}</Badge>
                              <span className="text-sm text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">
                                {service.duration_minutes ? `${service.duration_minutes} mins` : 'Flexible'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">Revenue:</span>
                                <div className="font-semibold text-success">{(service.price * 8).toLocaleString()} pts</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Orders:</span>
                                <div className="font-semibold">8</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Views:</span>
                                <div className="font-semibold">245</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Inquiries:</span>
                                <div className="font-semibold">18</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingService(service)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center space-x-4">
                            <span className="font-semibold text-accent">{service.price} points</span>
                            <Badge variant={service.is_active ? 'default' : 'secondary'}>
                              {service.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => window.open('#', '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Calendar
                          </Button>
                        </div>
                      </div>
                    ))}
                    {myServices.length > 3 && (
                      <div className="text-center pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setServicesModalOpen(true)}
                        >
                          View All Services ({myServices.length})
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Sessions - Takes 1 column */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setUpcomingSessionsModalOpen(true)}
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary" />
                <span>Upcoming Sessions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingSessions.slice(0, 2).map((session) => (
                  <div key={session.id} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="font-medium text-sm text-foreground">{session.service}</h5>
                        <p className="text-xs text-muted-foreground">with {session.consultant}</p>
                      </div>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs">{session.duration}</Badge>
                        {session.status && (
                          <Badge variant={session.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                            {session.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{session.date}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{session.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {upcomingSessions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No upcoming sessions</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Service Dialog */}
        <Dialog open={showAddService} onOpenChange={setShowAddService}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Service</DialogTitle>
            </DialogHeader>
            <ServiceForm
              mode="create"
              onSubmit={handleCreateService}
              isLoading={createService.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Service Dialog */}
        <Dialog open={!!editingService} onOpenChange={() => setEditingService(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Service</DialogTitle>
            </DialogHeader>
            {editingService && (
              <ServiceForm
                mode="edit"
                initialData={editingService}
                onSubmit={handleUpdateService}
                isLoading={updateService.isPending}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Earnings Modal */}
        <EarningsModal
          open={earningsModalOpen}
          onOpenChange={(open, newFilter) => {
            if (!open && newFilter) {
              handleEarningsModalClose(newFilter);
            } else {
              setEarningsModalOpen(open);
            }
          }}
          totalEarnings={mockEarningsData[currentEarningsFilter]}
        />

        {/* Recent Orders Modal */}
        <RecentOrdersModal
          open={ordersModalOpen}
          onOpenChange={setOrdersModalOpen}
          orders={recentOrders}
        />

        {/* Services Details Modal */}
        <ServicesDetailsModal
          open={servicesModalOpen}
          onOpenChange={setServicesModalOpen}
          services={myServices}
          onEditService={setEditingService}
          onDeleteService={handleDeleteService}
          isLoading={servicesLoading}
        />

        {/* Performance Modal */}
        <PerformanceModal
          open={performanceModalOpen}
          onOpenChange={setPerformanceModalOpen}
        />

        {/* Buyer Reviews Modal */}
        <BuyerReviewsModal
          open={reviewsModalOpen}
          onOpenChange={setReviewsModalOpen}
          userId={user?.id || ''}
          mode="buyer"
        />

        {/* Upcoming Sessions Modal */}
        <UpcomingSessionsModal
          open={upcomingSessionsModalOpen}
          onOpenChange={setUpcomingSessionsModalOpen}
          sessions={upcomingSessions}
        />
      </div>
    </div>
  );
}
