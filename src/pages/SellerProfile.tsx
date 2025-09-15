
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { BuyerProfileHeader } from '@/components/profile/BuyerProfileHeader';
import { BuyerProfileStats } from '@/components/profile/BuyerProfileStats';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { getBuyerProfileStats } from '@/utils/profileUtils';

export default function SellerProfile() {
  const { userId } = useParams();
  const { profile: currentUserProfile } = useAuth();
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['seller-profile', userId],
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

  const { data: consultant } = useQuery({
    queryKey: ['consultant-data', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultants')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });

  const { data: profileStats } = useQuery({
    queryKey: ['seller-profile-stats', userId],
    queryFn: () => getBuyerProfileStats(userId!),
    enabled: !!userId
  });

  if (isLoading) {
    return (
      <SidebarLayout title="Loading Profile..." description="Please wait while we load the seller profile">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading profile...</div>
        </div>
      </SidebarLayout>
    );
  }

  if (!profile) {
    return (
      <SidebarLayout title="Profile Not Found" description="The requested seller profile could not be found">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Profile not found</div>
        </div>
      </SidebarLayout>
    );
  }

  const isOwnProfile = currentUserProfile?.user_id === userId;

  return (
    <SidebarLayout title={`${profile?.full_name || 'Seller'} Profile`} description="View seller profile and activity">
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
          consultant={consultant}
        />
      )}
    </SidebarLayout>
  );
}
