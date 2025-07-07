
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
import { PerformanceModal } from "@/components/dashboard/PerformanceModal";
import { BuyerReviewsModal } from "@/components/dashboard/BuyerReviewsModal";
import { ServicesDetailsModal } from "@/components/dashboard/ServicesDetailsModal";
import { useToast } from "@/hooks/use-toast";
import { useConsultantServices, useCreateService, useUpdateService, useDeleteService } from "@/hooks/useServiceOperations";
import { 
  Plus, 
  TrendingUp, 
  Users, 
  Calendar,
  Star,
  BarChart3
} from "lucide-react";

export default function ConsultantDashboard() {
  const { toast } = useToast();
  const [showAddService, setShowAddService] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [earningsModalOpen, setEarningsModalOpen] = useState(false);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [performanceModalOpen, setPerformanceModalOpen] = useState(false);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  
  const { data: services, isLoading: servicesLoading } = useConsultantServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  // Mock consultant data
  const consultantProfile = {
    name: "Sarah Chen",
    tier: "platinum" as const,
    totalEarnings: 15750,
    totalSessions: 42,
    rating: 4.8,
    totalReviews: 24,
    conversionRate: 85
  };

  // Calculate stats from real services
  const totalServices = services?.length || 0;
  const activeServices = services?.filter(s => s.is_active).length || 0;
  const totalRevenue = services?.reduce((sum, s) => sum + (s.price * 5), 0) || 0; // Mock booking count
  
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

        {/* Updated Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            className="bg-gradient-to-br from-accent to-accent/80 text-accent-foreground cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setEarningsModalOpen(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Earnings
                <TrendingUp className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRevenue.toLocaleString()}</div>
              <p className="text-xs opacity-90">earnings over time</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setOrdersModalOpen(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                All Past Orders
                <Users className="w-4 h-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{consultantProfile.totalSessions}</div>
              <p className="text-xs text-muted-foreground">completed sessions</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setPerformanceModalOpen(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Performance
                <BarChart3 className="w-4 h-4 text-success" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{consultantProfile.rating}</div>
              <p className="text-xs text-muted-foreground">rating & conversion</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setReviewsModalOpen(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Buyer Reviews
                <Star className="w-4 h-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{consultantProfile.totalReviews}</div>
              <p className="text-xs text-muted-foreground">total reviews</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Services - Now Clickable Card */}
          <Card 
            className="cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => setServicesModalOpen(true)}
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>My Services</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {servicesLoading ? (
                <div className="text-center py-8">Loading services...</div>
              ) : services && services.length > 0 ? (
                <div className="space-y-4">
                  {services.slice(0, 3).map((service) => (
                    <div key={service.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">{service.title}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary">{service.categories?.name || 'Uncategorized'}</Badge>
                            <Badge variant={service.is_active ? 'default' : 'secondary'}>
                              {service.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 font-semibold text-accent">
                          <span>{service.price} points</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {services.length > 3 && (
                    <div className="text-center pt-2">
                      <p className="text-sm text-muted-foreground">
                        +{services.length - 3} more services
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No services created yet. Click "Add Service" to get started.
                </div>
              )}
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

        {/* Updated Modals */}
        <EarningsModal
          open={earningsModalOpen}
          onOpenChange={setEarningsModalOpen}
          totalEarnings={totalRevenue}
        />

        <RecentOrdersModal
          open={ordersModalOpen}
          onOpenChange={setOrdersModalOpen}
          orders={[]}
        />

        <PerformanceModal
          open={performanceModalOpen}
          onOpenChange={setPerformanceModalOpen}
          rating={consultantProfile.rating}
          conversionRate={consultantProfile.conversionRate}
        />

        <BuyerReviewsModal
          open={reviewsModalOpen}
          onOpenChange={setReviewsModalOpen}
          totalReviews={consultantProfile.totalReviews}
          averageRating={consultantProfile.rating}
        />

        <ServicesDetailsModal
          open={servicesModalOpen}
          onOpenChange={setServicesModalOpen}
          services={services || []}
          onEditService={setEditingService}
          onDeleteService={handleDeleteService}
          isLoading={servicesLoading}
        />

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
      </div>
    </div>
  );
}
