
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { AllServicesModal } from '@/components/profile/AllServicesModal';
import { ReviewsModal } from '@/components/profile/ReviewsModal';
import { ConsultantProfileHeader } from '@/components/profile/ConsultantProfileHeader';
import { ConsultantProfileStats } from '@/components/profile/ConsultantProfileStats';
import { ConsultantServicesSection } from '@/components/profile/ConsultantServicesSection';
import { ConsultantReviewsSection } from '@/components/profile/ConsultantReviewsSection';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export default function ConsultantProfile() {
  const { userId } = useParams();
  const { profile: currentUserProfile } = useAuth();
  const navigate = useNavigate();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [allServicesModalOpen, setAllServicesModalOpen] = useState(false);

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

  const handleServiceDetails = (serviceId: string) => {
    navigate(`/service/${serviceId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <ConsultantProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          onEditClick={() => setEditModalOpen(true)}
        />

        <ConsultantProfileStats
          servicesCount={services?.length || 0}
          bookingStats={bookingStats}
          onAllServicesClick={() => setAllServicesModalOpen(true)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ConsultantServicesSection
            services={services}
            onServiceDetails={handleServiceDetails}
            onAllServicesClick={() => setAllServicesModalOpen(true)}
          />

          <ConsultantReviewsSection
            onReviewsClick={() => setReviewsModalOpen(true)}
          />
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

      <AllServicesModal
        open={allServicesModalOpen}
        onOpenChange={setAllServicesModalOpen}
        services={services || []}
        consultantName={profile?.full_name || 'Professional Consultant'}
        onServiceDetails={handleServiceDetails}
      />
    </div>
  );
}
