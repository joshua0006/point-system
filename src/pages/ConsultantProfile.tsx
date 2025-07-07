
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TierBadge } from '@/components/TierBadge';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { 
  Star, 
  Calendar, 
  Award,
  TrendingUp,
  Users,
  Clock,
  Edit
} from 'lucide-react';
import { ReviewsModal } from '@/components/profile/ReviewsModal';

export default function ConsultantProfile() {
  const { userId } = useParams();
  const { profile: currentUserProfile } = useAuth();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['consultant-profile', userId],
    queryFn: async () => {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (profileError) throw profileError;

      const { data: consultantData, error: consultantError } = await supabase
        .from('consultants')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      return {
        ...profileData,
        consultant: consultantData
      };
    },
    enabled: !!userId
  });

  const { data: services } = useQuery({
    queryKey: ['consultant-services', userId],
    queryFn: async () => {
      if (!profile?.consultant?.id) return [];
      
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          categories (name)
        `)
        .eq('consultant_id', profile.consultant.id)
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.consultant?.id
  });

  const { data: bookingStats } = useQuery({
    queryKey: ['consultant-booking-stats', userId],
    queryFn: async () => {
      if (!profile?.consultant?.id) return { total: 0, completed: 0 };
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('consultant_id', profile.consultant.id);
      
      if (error) return { total: 0, completed: 0 };
      
      const total = data.length;
      const completed = data.filter(b => b.status === 'completed').length;
      
      return { total, completed };
    },
    enabled: !!profile?.consultant?.id
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile || !profile.consultant) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Consultant profile not found</div>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUserProfile?.user_id === userId;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Card>
            <CardContent className="pt-6 relative">
              {isOwnProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-4 right-4"
                  onClick={() => setEditModalOpen(true)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              
              <div className="flex flex-col md:flex-row items-start gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.avatar_url || ''} />
                  <AvatarFallback className="text-2xl">
                    {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-foreground">
                        {profile.full_name || 'Professional Consultant'}
                      </h1>
                      <TierBadge tier={profile.consultant.tier} />
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary">Consultant</Badge>
                      <span className="text-sm text-muted-foreground">
                        Active since {new Date(profile.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-3">
                      {profile.consultant.bio || 'Experienced consultant ready to help with your needs'}
                    </p>
                    {profile.consultant.expertise_areas && profile.consultant.expertise_areas.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {profile.consultant.expertise_areas.map((area, index) => (
                          <Badge key={index} variant="outline">{area}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Active Services
                <TrendingUp className="w-4 h-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {services?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">available services</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Total Bookings
                <Calendar className="w-4 h-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {bookingStats?.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">sessions booked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Completed
                <Award className="w-4 h-4 text-success" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {bookingStats?.completed || 0}
              </div>
              <p className="text-xs text-muted-foreground">successful sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Response Rate
                <Clock className="w-4 h-4 text-accent" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">98%</div>
              <p className="text-xs text-muted-foreground">within 24 hours</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Available Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              {services && services.length > 0 ? (
                <div className="space-y-4">
                  {services.slice(0, 3).map((service) => (
                    <div key={service.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">{service.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {service.description.substring(0, 100)}...
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="secondary">{service.categories?.name || 'General'}</Badge>
                            {service.duration_minutes && (
                              <Badge variant="outline">{service.duration_minutes} min</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 font-semibold text-accent">
                          <span>{service.price} points</span>
                        </div>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                  {services.length > 3 && (
                    <div className="text-center pt-2">
                      <p className="text-sm text-muted-foreground">
                        +{services.length - 3} more services available
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No services available at the moment</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews/Ratings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Reviews & Ratings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="cursor-pointer hover:bg-muted/50 rounded-lg p-4 -m-4 transition-colors"
                onClick={() => setReviewsModalOpen(true)}
              >
                <div className="text-center py-4">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Star className="w-8 h-8 text-yellow-400 fill-current" />
                    <span className="text-3xl font-bold">4.8</span>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Average rating from {bookingStats?.completed || 6} reviews
                  </p>
                  
                  {/* Recent Reviews Preview */}
                  <div className="space-y-3 mb-4">
                    <div className="text-left p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">Sarah J.</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        "Exceptional service! The consultant provided deep insights..."
                      </p>
                    </div>
                    
                    <div className="text-left p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">Michael R.</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        "Outstanding workshop! The strategies provided were..."
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-sm text-primary hover:text-primary/80 transition-colors">
                    Click to view all reviews →
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <EditProfileModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        profile={profile}
        consultant={profile.consultant}
      />

      <ReviewsModal
        open={reviewsModalOpen}
        onOpenChange={setReviewsModalOpen}
        consultantName={profile?.full_name || 'Professional Consultant'}
      />
    </div>
  );
}
