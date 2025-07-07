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
        {/* Enhanced Header Section */}
        <div className="mb-10">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/30 relative">
            <CardContent className="p-8">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full -translate-y-8 translate-x-8 opacity-50 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent/10 to-primary/10 rounded-full translate-y-4 -translate-x-4 opacity-30 pointer-events-none" />
              
              {/* Edit Button - Fixed positioning */}
              {isOwnProfile && (
                <div className="absolute top-6 right-6 z-20">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm border-2 hover:border-primary/20 transition-all duration-200"
                    onClick={() => setEditModalOpen(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              )}
              
              <div className="flex flex-col lg:flex-row items-start gap-8 relative z-10">
                <div className="flex flex-col items-center lg:items-start">
                  <Avatar className="w-32 h-32 ring-4 ring-background shadow-xl">
                    <AvatarImage src={profile.avatar_url || ''} className="object-cover" />
                    <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-accent text-white">
                      {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Member since info moved under avatar */}
                  <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex-1 space-y-6">
                  {/* Name and badges section */}
                  <div className="space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <h1 className="text-4xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                        {profile.full_name || 'Anonymous Buyer'}
                      </h1>
                      <div className="flex items-center gap-3">
                        {profileStats && (
                          <ExperienceBadge experienceLevel={profileStats.experienceLevel} />
                        )}
                        <Badge variant="secondary" className="px-3 py-1">
                          <User className="w-3 h-3 mr-2" />
                          Buyer
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Profile Description */}
                    {profile.bio ? (
                      <div className="bg-muted/30 rounded-lg p-4 border-l-4 border-primary/30">
                        <p className="text-muted-foreground leading-relaxed">
                          {profile.bio}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-muted/20 rounded-lg p-4 border border-dashed border-muted-foreground/20">
                        <p className="text-muted-foreground/60 italic text-center">
                          No bio added yet
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Consultation Areas */}
                  {profileStats?.consultationCategories && profileStats.consultationCategories.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Target className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-semibold text-foreground">Consultation Areas</span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {profileStats.consultationCategories.map((category, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className="px-4 py-2 text-sm bg-background/50 hover:bg-background transition-colors"
                          >
                            {category.name}
                            <span className="ml-2 bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
                              {category.count}
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
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

          <Card className="hover:shadow-lg transition-shadow">
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

          <Card className="hover:shadow-lg transition-shadow">
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

          <Card className="hover:shadow-lg transition-shadow">
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

      {profile && (
        <EditProfileModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          profile={profile}
        />
      )}
    </div>
  );
}
