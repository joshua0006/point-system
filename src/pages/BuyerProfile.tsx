
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { ExperienceBadge } from '@/components/profile/ExperienceBadge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { getBuyerProfileStats } from '@/utils/profileUtils';
import { 
  User, 
  Calendar, 
  Award,
  MessageSquare,
  Star,
  Edit,
  Target
} from 'lucide-react';

export default function BuyerProfile() {
  const { userId } = useParams();
  const { profile: currentUserProfile } = useAuth();
  const [editModalOpen, setEditModalOpen] = useState(false);

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

  const { data: profileStats } = useQuery({
    queryKey: ['buyer-profile-stats', userId],
    queryFn: () => getBuyerProfileStats(userId!),
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
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                      <h1 className="text-3xl font-bold text-foreground">
                        {profile.full_name || 'Anonymous Buyer'}
                      </h1>
                      {profileStats && (
                        <ExperienceBadge experienceLevel={profileStats.experienceLevel} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary">
                        <User className="w-3 h-3 mr-1" />
                        Buyer
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Member since {new Date(profile.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {/* Profile Description */}
                    {profile.bio && (
                      <p className="text-muted-foreground mb-4">
                        {profile.bio}
                      </p>
                    )}
                    
                    {/* Consultation Areas */}
                    {profileStats?.consultationCategories && profileStats.consultationCategories.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">Consultation Areas</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {profileStats.consultationCategories.map((category, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {category.name}
                              <span className="ml-1 bg-muted px-1 py-0.5 rounded-full text-xs">
                                {category.count}
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <p className="text-muted-foreground text-sm">
                      Active marketplace participant with {profileStats?.completedBookings || 0} successful consultations
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Total Bookings
                <Calendar className="w-4 h-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {profileStats?.totalBookings || 0}
              </div>
              <p className="text-xs text-muted-foreground">services booked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Completion Rate
                <Award className="w-4 h-4 text-success" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {Math.round(profileStats?.completionRate || 0)}%
              </div>
              <p className="text-xs text-muted-foreground">sessions completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Response Time
                <MessageSquare className="w-4 h-4 text-blue-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {profileStats?.averageResponseTimeHours || 0}h
              </div>
              <p className="text-xs text-muted-foreground">average response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                Average Rating
                <Star className="w-4 h-4 text-yellow-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {profileStats?.averageRating?.toFixed(1) || 'N/A'}
              </div>
              <div className="flex items-center mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${
                      star <= Math.round(profileStats?.averageRating || 0)
                        ? 'text-yellow-500 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <EditProfileModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        profile={profile}
      />
    </div>
  );
}
