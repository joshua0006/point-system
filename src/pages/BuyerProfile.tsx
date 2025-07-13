import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { BuyerProfileHeader } from '@/components/profile/BuyerProfileHeader';
import { BuyerProfileStats } from '@/components/profile/BuyerProfileStats';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { getBuyerProfileStats } from '@/utils/profileUtils';

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
    queryFn: () => {
      // Return demo stats for buyer profile
      return {
        totalBookings: 12,
        completionRate: 92,
        averageResponseTimeHours: 1.5,
        averageRating: 4.6,
        experienceLevel: {
          level: 'Experienced' as const,
          color: 'bg-purple-100 text-purple-800',
          description: 'Experienced user'
        },
        consultationCategories: [
          { name: 'Business Strategy', count: 5 },
          { name: 'Marketing', count: 3 },
          { name: 'Technology', count: 4 }
        ]
      };
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

  const isOwnProfile = currentUserProfile?.user_id === userId;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <BuyerProfileHeader
          profile={profile}
          profileStats={profileStats}
          isOwnProfile={isOwnProfile}
          onEditClick={() => setEditModalOpen(true)}
        />

        <BuyerProfileStats profileStats={profileStats} />
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
