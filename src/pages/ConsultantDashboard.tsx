import { useState, useEffect } from "react";
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
import { UpcomingSessionsModal } from "@/components/dashboard/UpcomingSessionsModal";
import { ServicesBookedModal } from "@/components/dashboard/ServicesBookedModal";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import { useConsultantServices, useCreateService, useUpdateService, useDeleteService } from "@/hooks/useServiceOperations";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
  Target,
  ArrowUpDown,
  TrendingDown,
  BookOpen
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
  const { user } = useAuth();
  const [showAddService, setShowAddService] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  
  // Modal states
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [earningsModalOpen, setEarningsModalOpen] = useState(false);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [performanceModalOpen, setPerformanceModalOpen] = useState(false);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [upcomingModalOpen, setUpcomingModalOpen] = useState(false);
  const [servicesBookedModalOpen, setServicesBookedModalOpen] = useState(false);
  
  // Mode states for each section
  const [earningsMode, setEarningsMode] = useState<EarningsMode>("earnings");
  const [ordersMode, setOrdersMode] = useState<OrdersMode>("selling");
  const [servicesMode, setServicesMode] = useState<ServicesMode>("seller");
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>("seller");
  const [reviewsMode, setReviewsMode] = useState<ReviewsMode>("seller");
  const [sessionsMode, setSessionsMode] = useState<SessionsMode>("selling");
  
  const [currentEarningsFilter, setCurrentEarningsFilter] = useState<TimeScale>("lifetime");
  
  // Real data states
  const [consultantProfile, setConsultantProfile] = useState({
    name: "",
    tier: "bronze" as "bronze" | "silver" | "gold" | "platinum",
    totalEarnings: 0,
    totalSpendings: 0,
    totalSessions: 0,
    totalPurchases: 0,
    sellerRating: 0,
    buyerRating: 0,
    totalSellerReviews: 0,
    totalBuyerReviews: 0,
    conversionRate: 0,
    pointsBalance: 0
  });

  const [mockTransactions, setMockTransactions] = useState<any[]>([]);
  const [bookedServices, setBookedServices] = useState<any[]>([]);
  const [upcomingSellingBookings, setUpcomingSellingBookings] = useState<any[]>([]);
  const [upcomingBuyingBookings, setUpcomingBuyingBookings] = useState<any[]>([]);
  
  const { data: services, isLoading: servicesLoading } = useConsultantServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  useEffect(() => {
    if (user) {
      fetchConsultantData();
    }

    // Set up real-time updates for points transactions and bookings
    if (user?.id) {
      const channel = supabase
        .channel('consultant-dashboard-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'points_transactions',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Transaction updated:', payload);
            fetchConsultantData(); // Refresh data
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings'
          },
          (payload) => {
            console.log('Booking updated:', payload);
            fetchConsultantData(); // Refresh data for any booking change
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchConsultantData = async () => {
    if (!user) return;

    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, points_balance')
        .eq('user_id', user.id)
        .single();

      console.log('Profile data:', profile, 'Profile error:', profileError);

      // Fetch consultant data - include both id and tier
      const { data: consultant, error: consultantError } = await supabase
        .from('consultants')
        .select('id, tier')
        .eq('user_id', user.id)
        .single();

      console.log('Consultant data:', consultant, 'Consultant error:', consultantError);

      // Fetch real transactions for this consultant
      const { data: transactions, error: transactionsError } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Transactions data:', transactions, 'Error:', transactionsError);

      // Fetch bookings where this user is the seller (consultant)
      const { data: sellerBookings, error: sellerBookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          services!inner(
            title,
            price,
            duration_minutes
          )
        `)
        .eq('consultant_id', consultant?.id)
        .order('created_at', { ascending: false });

      console.log('Seller bookings data:', sellerBookings, 'Error:', sellerBookingsError);

      // Fetch bookings where this user is the buyer
      const { data: buyerBookings, error: buyerBookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          services!inner(
            title,
            price,
            duration_minutes
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Buyer bookings data:', buyerBookings, 'Error:', buyerBookingsError);

      // Calculate real stats
      const earnings = transactions?.filter(t => t.type === 'earning').reduce((sum, t) => sum + t.amount, 0) || 0;
      const spendings = transactions?.filter(t => t.type === 'purchase').reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
      const totalSellerSessions = sellerBookings?.length || 0;
      const totalBuyerSessions = buyerBookings?.length || 0;
      const completedSellerSessions = sellerBookings?.filter(b => b.status === 'completed').length || 0;

      setConsultantProfile({
        name: profile?.full_name || "John Consultant",
        tier: (consultant?.tier as "bronze" | "silver" | "gold" | "platinum") || "bronze",
        totalEarnings: earnings,
        totalSpendings: spendings,
        totalSessions: totalSellerSessions,
        totalPurchases: totalBuyerSessions,
        sellerRating: 4.3, // Keep demo for now
        buyerRating: 4.1, // Keep demo for now
        totalSellerReviews: 6, // Keep demo for now
        totalBuyerReviews: 2, // Keep demo for now
        conversionRate: totalSellerSessions > 0 ? Math.round((completedSellerSessions / totalSellerSessions) * 100) : 0,
        pointsBalance: profile?.points_balance || 0
      });

      // Transform transactions for BalanceDetailsModal
      const transformedTransactions = (transactions || []).map(t => ({
        id: t.id,
        type: t.type === 'earning' ? 'earned' : 'spent',
        service: t.description || 'Transaction',
        consultant: undefined,
        points: Math.abs(t.amount),
        date: new Date(t.created_at).toLocaleDateString(),
        status: 'completed'
      }));
      
      // Transform seller bookings for ServicesBookedModal
      const transformedSellerBookings = (sellerBookings || []).map(b => ({
        id: b.id,
        service: b.services?.title || 'Unknown Service',
        consultant: 'You (Consultant)',
        date: new Date(b.created_at).toLocaleDateString(),
        time: b.scheduled_at ? new Date(b.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
        duration: b.services?.duration_minutes ? `${b.services.duration_minutes} mins` : undefined,
        status: b.status,
        points: b.points_spent
      }));

      // Transform buyer bookings for ServicesBookedModal
      const transformedBuyerBookings = (buyerBookings || []).map(b => ({
        id: b.id,
        service: b.services?.title || 'Unknown Service',
        consultant: 'External Consultant',
        date: new Date(b.created_at).toLocaleDateString(),
        time: b.scheduled_at ? new Date(b.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
        duration: b.services?.duration_minutes ? `${b.services.duration_minutes} mins` : undefined,
        status: b.status,
        points: b.points_spent
      }));

      setMockTransactions(transformedTransactions);
      
      // Combine all bookings
      const allBookings = [...transformedSellerBookings, ...transformedBuyerBookings];
      setBookedServices(allBookings);
      
      // Process upcoming sessions
      const now = new Date();
      const upcomingSelling = transformedSellerBookings
        .filter(b => b.status === 'confirmed')
        .map(b => ({
          id: b.id,
          service: b.service,
          consultant: b.consultant,
          date: b.date,
          time: b.time || '00:00',
          duration: b.duration || '30 mins',
          bookingUrl: '#',
          status: 'confirmed' as const
        }));
        
      const upcomingBuying = transformedBuyerBookings
        .filter(b => b.status === 'confirmed')
        .map(b => ({
          id: b.id,
          service: b.service,
          consultant: b.consultant,
          date: b.date,
          time: b.time || '00:00',
          duration: b.duration || '30 mins',
          bookingUrl: '#',
          status: 'confirmed' as const
        }));
        
      setUpcomingSellingBookings(upcomingSelling);
      setUpcomingBuyingBookings(upcomingBuying);

    } catch (error) {
      console.error('Error fetching consultant data:', error);
    }
  };

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
                Dashboard
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

        {/* First Row: Point Balance, Spending/Earning, Orders Completed */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <span>{getEarningsLabel(currentEarningsFilter, earningsMode)}</span>
                  <ToggleGroup 
                    type="single" 
                    value={earningsMode} 
                    onValueChange={(value) => value && setEarningsMode(value as EarningsMode)}
                    className="h-6"
                  >
                    <ToggleGroupItem 
                      value="earnings" 
                      size="sm" 
                      className="px-2 py-1 text-xs bg-white/20 data-[state=on]:bg-white/40 data-[state=on]:text-accent-foreground"
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Earn
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="spendings" 
                      size="sm" 
                      className="px-2 py-1 text-xs bg-white/20 data-[state=on]:bg-white/40 data-[state=on]:text-accent-foreground"
                    >
                      <TrendingDown className="w-3 h-3 mr-1" />
                      Spend
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <ArrowUpDown className="w-4 h-4" />
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
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <span>{getOrdersLabel(ordersMode)}</span>
                  <ToggleGroup 
                    type="single" 
                    value={ordersMode} 
                    onValueChange={(value) => value && setOrdersMode(value as OrdersMode)}
                    className="h-6"
                  >
                    <ToggleGroupItem 
                      value="selling" 
                      size="sm" 
                      className="px-2 py-1 text-xs"
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Sell
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="buying" 
                      size="sm" 
                      className="px-2 py-1 text-xs"
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Buy
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <Users className="w-4 h-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{getOrdersValue(ordersMode)}</div>
              <p className="text-xs text-muted-foreground">total orders</p>
            </CardContent>
          </Card>
        </div>

        {/* Second Row: Performance, Reviews, Upcoming Sessions, All Booked Services */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Performance */}
          <Card 
            className="cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setPerformanceModalOpen(true)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <span>Performance</span>
                  <ToggleGroup 
                    type="single" 
                    value={performanceMode} 
                    onValueChange={(value) => value && setPerformanceMode(value as PerformanceMode)}
                    className="h-6"
                  >
                    <ToggleGroupItem 
                      value="seller" 
                      size="sm" 
                      className="px-2 py-1 text-xs"
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Sell
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="buyer" 
                      size="sm" 
                      className="px-2 py-1 text-xs"
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Buy
                    </ToggleGroupItem>
                  </ToggleGroup>
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
                    <span className="text-sm font-semibold">{getPerformanceData(performanceMode).rating || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Conversion:</span>
                  <span className="text-sm font-semibold">{getPerformanceData(performanceMode).conversion || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card 
            className="cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setReviewsModalOpen(true)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <span>Reviews</span>
                  <ToggleGroup 
                    type="single" 
                    value={reviewsMode} 
                    onValueChange={(value) => value && setReviewsMode(value as ReviewsMode)}
                    className="h-6"
                  >
                    <ToggleGroupItem 
                      value="seller" 
                      size="sm" 
                      className="px-2 py-1 text-xs"
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Sell
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="buyer" 
                      size="sm" 
                      className="px-2 py-1 text-xs"
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Buy
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <MessageCircle className="w-4 h-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-foreground">{getReviewsData(reviewsMode).count}</div>
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span className="text-sm font-semibold">{getReviewsData(reviewsMode).rating || 'N/A'}</span>
                  <span className="text-xs text-muted-foreground">average</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Sessions */}
          <Card 
            className="cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setUpcomingModalOpen(true)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <span>Upcoming Sessions</span>
                  <ToggleGroup 
                    type="single" 
                    value={sessionsMode} 
                    onValueChange={(value) => value && setSessionsMode(value as SessionsMode)}
                    className="h-6"
                  >
                    <ToggleGroupItem 
                      value="selling" 
                      size="sm" 
                      className="px-2 py-1 text-xs"
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Sell
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="buying" 
                      size="sm" 
                      className="px-2 py-1 text-xs"
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Buy
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <Clock className="w-4 h-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{getUpcomingSessions(sessionsMode).length}</div>
              <p className="text-xs text-muted-foreground">scheduled sessions</p>
            </CardContent>
          </Card>

          {/* All Booked Services */}
          <Card 
            className="cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setServicesBookedModalOpen(true)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                All Booked Services
                <BookOpen className="w-4 h-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-foreground">{bookedServices.length}</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {bookedServices.filter(s => s.status === 'completed').length} completed
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Third Row: My Services Detail - Single section now */}
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

        <UpcomingSessionsModal
          open={upcomingModalOpen}
          onOpenChange={setUpcomingModalOpen}
          sessions={[...getUpcomingSessions(sessionsMode)]}
        />

        <ServicesBookedModal
          open={servicesBookedModalOpen}
          onOpenChange={setServicesBookedModalOpen}
          bookedServices={bookedServices}
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
