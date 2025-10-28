
import React, { lazy, Suspense, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TierBadge } from '@/components/TierBadge';
import { Star, Clock, ArrowLeft, Check, X, Calendar, ShoppingCart, MessageCircle } from '@/lib/icons';
import { useServices } from '@/hooks/useServices';
import { useBookService } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateConversation } from '@/hooks/useConversations';
import { useBookingSuccess } from '@/hooks/useBookingSuccess';

// PERFORMANCE: Lazy load heavy components to reduce ServiceDetail bundle (48 KB → ~25 KB)
// ChatWindow and BookingSuccessModal are only shown conditionally, perfect for code splitting
const ChatWindow = lazy(() => import('@/components/chat/ChatWindow').then(m => ({ default: m.ChatWindow })));
const BookingSuccessModal = lazy(() => import('@/components/booking/BookingSuccessModal').then(m => ({ default: m.BookingSuccessModal })));

const ServiceDetail = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: services = [], isLoading } = useServices();
  const { isSuccessModalOpen, bookingDetails, showSuccessModal, hideSuccessModal } = useBookingSuccess();
  const createConversationMutation = useCreateConversation();
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  
  console.log('ServiceDetail - serviceId from params:', serviceId);
  console.log('ServiceDetail - services data:', services);
  
  const bookServiceMutation = useBookService(async (booking, serviceData) => {
    showSuccessModal({
      id: booking.id,
      serviceTitle: serviceData.title,
      consultantName: serviceData.consultantName,
      consultantTier: serviceData.consultantTier,
      price: serviceData.price,
      duration: serviceData.duration_minutes,
      description: serviceData.description,
    });

    // Create conversation for the new purchase
    if (service?.consultant?.user_id) {
      try {
        const newConversation = await createConversationMutation.mutateAsync({
          serviceId: service.id,
          sellerUserId: service.consultant.user_id,
        });
        setSelectedConversation(newConversation);
      } catch (error) {
        console.error('Failed to create conversation for booking:', error);
      }
    }
  });

  const service = services.find(s => s.id === serviceId);
  console.log('ServiceDetail - found service:', service);
  
  // Always create new conversations for each interaction

  const handlePurchase = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to purchase services.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    
    if (service && service.consultant) {
      const consultantName = service.consultant?.profiles?.full_name || 
                           service.consultant?.profiles?.email || 
                           'Unknown Consultant';
      
      bookServiceMutation.mutate({
        serviceId: service.id,
        consultantId: service.consultant.id,
        price: service.price,
        serviceData: {
          title: service.title,
          description: service.description,
          consultantName,
          consultantTier: service.consultant.tier,
          price: service.price,
          duration_minutes: service.duration_minutes,
        }
      });
    }
  };

  const handleMessageClick = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to message consultants.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!service?.consultant?.user_id) {
      toast({
        title: "Error",
        description: "Consultant information not available.",
        variant: "destructive",
      });
      return;
    }

    // Always create new conversation for each interaction
    try {
      const newConversation = await createConversationMutation.mutateAsync({
        serviceId: service.id,
        sellerUserId: service.consultant.user_id,
      });
      setSelectedConversation(newConversation);
      setChatOpen(true);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleBookingClick = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to contact consultants.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    
    if (service?.consultant?.calendar_link) {
      window.open(service.consultant.calendar_link, '_blank');
    } else {
      toast({
        title: "Booking unavailable",
        description: "This consultant hasn't set up their booking link yet.",
        variant: "destructive",
      });
    }
  };

  const handleConsultantClick = () => {
    if (service?.consultant?.user_id) {
      navigate(`/profile/consultant/${service.consultant.user_id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!service) {
    console.log('ServiceDetail - No service found for ID:', serviceId);
    return (
      <SidebarLayout title="Service Not Found" description="The requested service could not be found">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Service not found</h1>
          <p className="text-muted-foreground mb-4">
            The service you're looking for doesn't exist or may have been removed.
          </p>
          <Button onClick={() => navigate('/marketplace')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  const consultantName = service.consultant?.profiles?.full_name || 
                        service.consultant?.profiles?.email || 
                        'Unknown Consultant';

  return (
    <SidebarLayout title={service?.title || 'Service Details'} description="View service details and book a consultation">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/marketplace')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Service Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge variant="secondary" className="mb-3">
                      {service.categories?.name || 'Uncategorized'}
                    </Badge>
                    <CardTitle className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                      {service.title}
                    </CardTitle>
                    <CardDescription className="text-lg text-muted-foreground">
                      {service.description}
                    </CardDescription>
                  </div>
                </div>

                {/* Consultant Info */}
                <div 
                  className="flex items-center gap-4 pt-4 border-t cursor-pointer hover:bg-muted/50 rounded-md p-2 -m-2 transition-colors"
                  onClick={handleConsultantClick}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {consultantName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground hover:text-primary transition-colors">{consultantName}</h4>
                    <div className="flex items-center gap-2">
                      <TierBadge tier={service.consultant?.tier || 'bronze'} />
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-warning text-warning" />
                        <span className="text-sm font-medium">4.9</span>
                        <span className="text-sm text-muted-foreground">(156 reviews)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Service Features */}
            <Card>
              <CardHeader>
                <CardTitle>What you'll get</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-success/10 rounded-full">
                      <Check className="w-4 h-4 text-success" />
                    </div>
                    <span className="text-sm">Comprehensive analysis</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-success/10 rounded-full">
                      <Check className="w-4 h-4 text-success" />
                    </div>
                    <span className="text-sm">Detailed recommendations</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-success/10 rounded-full">
                      <Check className="w-4 h-4 text-success" />
                    </div>
                    <span className="text-sm">Follow-up support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-success/10 rounded-full">
                      <Check className="w-4 h-4 text-success" />
                    </div>
                    <span className="text-sm">Professional documentation</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Reviews</CardTitle>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-warning text-warning" />
                    <span className="text-lg font-semibold">4.9</span>
                    <span className="text-muted-foreground">(156 reviews)</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Review breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Seller communication level</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-warning text-warning" />
                      <span>4.9</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Service as described</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-warning text-warning" />
                      <span>4.9</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Would recommend</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-warning text-warning" />
                      <span>4.9</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Sample reviews */}
                <div className="space-y-4">
                  <div className="border-l-2 border-primary/20 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">JD</AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium text-sm">John Doe</span>
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map((star) => (
                            <Star key={star} className="w-3 h-3 fill-warning text-warning" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      "Excellent service! The consultant provided detailed insights and actionable recommendations. 
                      Very professional and delivered exactly what was promised."
                    </p>
                    <span className="text-xs text-muted-foreground">2 weeks ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Pricing & Booking */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card>
                <CardHeader>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-3xl font-bold text-primary">{service.price}</span>
                      <span className="text-sm text-muted-foreground">points</span>
                    </div>
                    {service.duration_minutes && (
                      <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{service.duration_minutes} minutes</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Package features */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span className="text-sm">Detailed analysis & recommendations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span className="text-sm">Professional documentation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span className="text-sm">Follow-up consultation included</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <X className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">24/7 priority support</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Action buttons */}
                  <div className="space-y-3">
                    <Button 
                      onClick={handlePurchase}
                      disabled={bookServiceMutation.isPending}
                      className="w-full"
                      size="lg"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {bookServiceMutation.isPending ? 'Processing...' : 'Purchase Service'}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={handleMessageClick}
                      disabled={createConversationMutation.isPending}
                      className="w-full"
                      size="lg"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {'Message Seller'}
                    </Button>
                    
                    <Button 
                      variant="ghost"
                      onClick={handleBookingClick}
                      className="w-full"
                      size="sm"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Call
                    </Button>
                  </div>

                  <div className="text-center text-xs text-muted-foreground">
                    Secure payment • 100% satisfaction guarantee
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* PERFORMANCE: Wrap lazy-loaded components in Suspense */}
      {/* These are modals/overlays, so no visible fallback needed */}
      <Suspense fallback={null}>
        <ChatWindow
          conversation={selectedConversation}
          open={chatOpen}
          onOpenChange={setChatOpen}
        />
      </Suspense>

      <Suspense fallback={null}>
        <BookingSuccessModal
          open={isSuccessModalOpen}
          onOpenChange={hideSuccessModal}
          bookingDetails={bookingDetails}
          conversationId={selectedConversation?.id}
          onMessageConsultant={() => {
            setSelectedConversation(selectedConversation);
            setChatOpen(true);
        }}
        />
      </Suspense>
    </SidebarLayout>
  );
};

export default ServiceDetail;
