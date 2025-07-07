
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
import { BalanceDetailsModal } from "@/components/dashboard/BalanceDetailsModal";
import { useToast } from "@/hooks/use-toast";
import { useConsultantServices, useCreateService, useUpdateService, useDeleteService } from "@/hooks/useServiceOperations";
import { 
  Plus, 
  TrendingUp, 
  Users, 
  Calendar,
  Star,
  BarChart3,
  Wallet,
  DollarSign,
  MessageCircle,
  Clock,
  ShoppingCart,
  Target
} from "lucide-react";

type TimeScale = "lifetime" | "yearly" | "monthly";
type EarningsMode = "earnings" | "spendings";
type OrdersMode = "selling" | "buying";
type ServicesMode = "seller" | "buyer";
type PerformanceMode = "seller" | "buyer";
type ReviewsMode = "seller" | "buyer";
type SessionsMode = "selling" | "buying";

export default function ConsultantDashboard() {
  const { toast } = useToast();
  const [showAddService, setShowAddService] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  
  // Modal states
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [earningsModalOpen, setEarningsModalOpen] = useState(false);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [performanceModalOpen, setPerformanceModalOpen] = useState(false);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  const [upcomingModalOpen, setUpcomingModalOpen] = useState(false);
  
  // Mode states for each section
  const [earningsMode, setEarningsMode] = useState<EarningsMode>("earnings");
  const [ordersMode, setOrdersMode] = useState<OrdersMode>("selling");
  const [servicesMode, setServicesMode] = useState<ServicesMode>("seller");
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>("seller");
  const [reviewsMode, setReviewsMode] = useState<ReviewsMode>("seller");
  const [sessionsMode, setSessionsMode] = useState<SessionsMode>("selling");
  
  const [currentEarningsFilter, setCurrentEarningsFilter] = useState<TimeScale>("lifetime");
  
  const { data: services, isLoading: servicesLoading } = useConsultantServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  // Mock consultant data
  const consultantProfile = {
    name: "Sarah Chen",
    tier: "platinum" as const,
    totalEarnings: 15750,
    totalSpendings: 8500,
    totalSessions: 42,
    totalPurchases: 18,
    sellerRating: 4.8,
    buyerRating: 4.6,
    totalSellerReviews: 24,
    totalBuyerReviews: 12,
    conversionRate: 85,
    pointsBalance: 2500
  };

  // Mock transaction data
  const mockTransactions = [
    {
      id: "1",
      type: "spent" as const,
      service: "Strategic Business Consultation",
      consultant: "John Smith",
      points: 500,
      date: "2024-01-18",
      status: "completed"
    },
    {
      id: "2",
      type: "earned" as const,
      service: "Growth Strategy Workshop",
      points: 350,
      date: "2024-01-19",
      status: "completed"
    },
  ];

  // Mock upcoming sessions data
  const upcomingSellingBookings = [
    {
      id: "1",
      service: "Strategic Business Consultation",
      client: "John D.",
      date: "2024-01-20",
      time: "2:00 PM",
      points: 500,
      type: "selling" as const
    },
  ];

  const upcomingBuyingBookings = [
    {
      id: "2",
      service: "Marketing Strategy Session",
      consultant: "Jane S.",
      date: "2024-01-22",
      time: "3:00 PM", 
      points: 350,
      type: "buying" as const
    },
  ];

  const getEarningsLabel = (filter: TimeScale, mode: EarningsMode) => {
    const prefix = mode === "earnings" ? "Earnings" : "Spendings";
    switch (filter) {
      case "lifetime":
        return `Lifetime ${prefix}`;
      case "yearly":
        return `Yearly ${prefix}`;
      case "monthly":
        return `Monthly ${prefix}`;
      default:
        return prefix;
    }
  };

  const getEarningsValue = (mode: EarningsMode) => {
    return mode === "earnings" ? consultantProfile.totalEarnings : consultantProfile.totalSpendings;
  };

  const getOrdersLabel = (mode: OrdersMode) => {
    return mode === "selling" ? "Orders Completed" : "Services Purchased";
  };

  const getOrdersValue = (mode: OrdersMode) => {
    return mode === "selling" ? consultantProfile.totalSessions : consultantProfile.totalPurchases;
  };

  const getPerformanceData = (mode: PerformanceMode) => {
    return {
      rating: mode === "seller" ? consultantProfile.sellerRating : consultantProfile.buyerRating,
      conversion: consultantProfile.conversionRate
    };
  };

  const getReviewsData = (mode: ReviewsMode) => {
    const sellerReviews = consultantProfile.totalSellerReviews;
    const buyerReviews = consultantProfile.totalBuyerReviews;
    
    if (mode === "seller") {
      return { count: sellerReviews, rating: consultantProfile.sellerRating };
    } else {
      return { count: buyerReviews, rating: consultantProfile.buyerRating };
    }
  };

  const getUpcomingSessions = (mode: SessionsMode) => {
    return mode === "selling" ? upcomingSellingBookings : upcomingBuyingBookings;
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

  const handleEarningsModalClose = (open: boolean, newFilter?: TimeScale) => {
    setEarningsModalOpen(open);
    if (newFilter) {
      setCurrentEarningsFilter(newFilter);
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
                Unified Dashboard
              </h1>
              <TierBadge tier={consultantProfile.tier} />
            </div>
            <p className="text-muted-foreground">
              Manage your services, track earnings, and monitor your activity
            </p>
          </div>
          <Button onClick={() => setShowAddService(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Current Point Balance */}
          <Card 
            className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setBalanceModalOpen(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Current Point Balance
                <Wallet className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{consultantProfile.pointsBalance.toLocaleString()}</div>
              <p className="text-xs opacity-90">click for history</p>
            </CardContent>
          </Card>

          {/* Earnings and Spendings */}
          <Card 
            className="bg-gradient-to-br from-accent to-accent/80 text-accent-foreground cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setEarningsModalOpen(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <span>{getEarningsLabel(currentEarningsFilter, earningsMode)}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEarningsMode(earningsMode === "earnings" ? "spendings" : "earnings");
                    }}
                  >
                    {earningsMode === "earnings" ? "→Spending" : "→Earning"}
                  </Button>
                </div>
                <TrendingUp className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getEarningsValue(earningsMode).toLocaleString()}</div>
              <p className="text-xs opacity-90">over time</p>
            </CardContent>
          </Card>

          {/* Lifetime Orders */}
          <Card 
            className="cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setOrdersModalOpen(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <span>{getOrdersLabel(ordersMode)}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOrdersMode(ordersMode === "selling" ? "buying" : "selling");
                    }}
                  >
                    {ordersMode === "selling" ? "→Buy" : "→Sell"}
                  </Button>
                </div>
                <Users className="w-4 h-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{getOrdersValue(ordersMode)}</div>
              <p className="text-xs text-muted-foreground">total orders</p>
            </CardContent>
          </Card>

          {/* Performance */}
          <Card 
            className="cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setPerformanceModalOpen(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <span>Performance</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPerformanceMode(performanceMode === "seller" ? "buyer" : "seller");
                    }}
                  >
                    {performanceMode === "seller" ? "→Buyer" : "→Seller"}
                  </Button>
                </div>
                <BarChart3 className="w-4 h-4 text-success" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rating:</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-sm font-semibold">{getPerformanceData(performanceMode).rating}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Conversion:</span>
                  <span className="text-sm font-semibold">{getPerformanceData(performanceMode).conversion}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Row of Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Reviews */}
          <Card 
            className="cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setReviewsModalOpen(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <span>Reviews</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReviewsMode(reviewsMode === "seller" ? "buyer" : "seller");
                    }}
                  >
                    {reviewsMode === "seller" ? "→Buyer" : "→Seller"}
                  </Button>
                </div>
                <MessageCircle className="w-4 h-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-foreground">{getReviewsData(reviewsMode).count}</div>
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span className="text-sm font-semibold">{getReviewsData(reviewsMode).rating}</span>
                  <span className="text-xs text-muted-foreground">average</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* My Services */}
          <Card 
            className="cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setServicesModalOpen(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                My Services
                <Target className="w-4 h-4 text-accent" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{services?.length || 0}</div>
              <p className="text-xs text-muted-foreground">active services</p>
            </CardContent>
          </Card>

          {/* Upcoming Sessions */}
          <Card 
            className="cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setUpcomingModalOpen(true)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <span>Upcoming Sessions</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSessionsMode(sessionsMode === "selling" ? "buying" : "selling");
                    }}
                  >
                    {sessionsMode === "selling" ? "→Buy" : "→Sell"}
                  </Button>
                </div>
                <Clock className="w-4 h-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{getUpcomingSessions(sessionsMode).length}</div>
              <p className="text-xs text-muted-foreground">scheduled sessions</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Views */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Services Detail */}
          <Card>
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

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getUpcomingSessions(sessionsMode).slice(0, 2).map((session) => (
                  <div key={session.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-foreground">{session.service}</h4>
                        <p className="text-sm text-muted-foreground">
                          {sessionsMode === "selling" ? `with ${session.client}` : `with ${session.consultant}`}
                        </p>
                      </div>
                      <Badge variant="outline">{session.points} pts</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{session.date}</span>
                        <span>{session.time}</span>
                      </div>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
                
                {getUpcomingSessions(sessionsMode).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No upcoming {sessionsMode} sessions
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modals */}
        <BalanceDetailsModal
          open={balanceModalOpen}
          onOpenChange={setBalanceModalOpen}
          transactions={mockTransactions}
        />

        <EarningsModal
          open={earningsModalOpen}
          onOpenChange={handleEarningsModalClose}
          totalEarnings={getEarningsValue(earningsMode)}
        />

        <RecentOrdersModal
          open={ordersModalOpen}
          onOpenChange={setOrdersModalOpen}
          orders={[]}
        />

        <PerformanceModal
          open={performanceModalOpen}
          onOpenChange={setPerformanceModalOpen}
        />

        <BuyerReviewsModal
          open={reviewsModalOpen}
          onOpenChange={setReviewsModalOpen}
          reviews={[]}
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
