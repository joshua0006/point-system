import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TierBadge } from '@/components/TierBadge';
import { Star, Clock, ArrowLeft, Check, X, Calendar, ShoppingCart, MessageCircle } from 'lucide-react';
import { useServices } from '@/hooks/useServices';
import { useBookService } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateConversation, useExistingConversation } from '@/hooks/useConversations';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useState } from 'react';

const ServiceDetail = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: services = [], isLoading } = useServices();
  const bookServiceMutation = useBookService();
  const createConversationMutation = useCreateConversation();
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);

  const service = services.find(s => s.id === serviceId);
  
  const { data: existingConversation } = useExistingConversation(
    serviceId || '', 
    service?.consultant?.id || ''
  );

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
      bookServiceMutation.mutate({
        serviceId: service.id,
        consultantId: service.consultant.id,
        price: service.price
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

    if (!service?.consultant) {
      toast({
        title: "Error",
        description: "Consultant information not available.",
        variant: "destructive",
      });
      return;
    }

    if (existingConversation) {
      // Open existing conversation
      setSelectedConversation(existingConversation);
      setChatOpen(true);
    } else {
      // Create new conversation
      try {
        const newConversation = await createConversationMutation.mutateAsync({
          serviceId: service.id,
          sellerId: service.consultant.id,
        });
        setSelectedConversation(newConversation);
        setChatOpen(true);
      } catch (error) {
        console.error('Failed to create conversation:', error);
      }
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Service not found</h1>
          <Button onClick={() => navigate('/marketplace')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const consultantName = service.consultant?.profiles?.full_name || 
                        service.consultant?.profiles?.email || 
                        'Unknown Consultant';

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
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
                <div className="flex items-center gap-4 pt-4 border-t">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {consultantName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{consultantName}</h4>
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
                      {existingConversation ? 'Continue Chat' : 'Message Seller'}
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

      <ChatWindow
        conversation={selectedConversation}
        open={chatOpen}
        onOpenChange={setChatOpen}
      />
    </div>
  );
};

export default ServiceDetail;