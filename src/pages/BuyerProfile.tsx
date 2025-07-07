
import { useParams } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { 
  User, 
  Star, 
  Calendar, 
  Award,
  MessageCircle,
  TrendingUp
} from 'lucide-react';

export default function BuyerProfile() {
  const { userId } = useParams();
  const { profile: currentUserProfile } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['buyer-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });

  const { data: bookingStats } = useQuery({
    queryKey: ['buyer-booking-stats', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId);
      
      if (error) return { total: 0, completed: 0 };
      
      const total = data.length;
      const completed = data.filter(b => b.status === 'completed').length;
      
      return { total, completed };
    },
    enabled: !!userId
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Profile not found</div>
        </div>
      </div>
    );
  }

  const canMessage = currentUserProfile?.user_id !== userId && currentUserProfile?.role === 'consultant';

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.avatar_url || ''} />
                  <AvatarFallback className="text-2xl">
                    {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground mb-2">
                        {profile.full_name || 'Anonymous Buyer'}
                      </h1>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary">
                          <User className="w-3 h-3 mr-1" />
                          Buyer
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Member since {new Date(profile.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground">
                        Active marketplace participant looking for expert consultation services
                      </p>
                    </div>
                    
                    {canMessage && (
                      <Button>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <p className="text-xs text-muted-foreground">services booked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Completed Sessions
                <Award className="w-4 h-4 text-success" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {bookingStats?.completed || 0}
              </div>
              <p className="text-xs text-muted-foreground">successful consultations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Points Balance
                <TrendingUp className="w-4 h-4 text-accent" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {profile.points_balance?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">available points</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>This buyer is actively seeking consultation services</p>
              <p className="text-sm mt-2">
                {bookingStats?.completed 
                  ? `Has completed ${bookingStats.completed} successful consultations`
                  : 'New to the platform - ready to start their consultation journey'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
