import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useConsultantReviews(consultantUserId: string) {
  return useQuery({
    queryKey: ['consultant-reviews', consultantUserId],
    queryFn: async () => {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewee_id', consultantUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!reviews) return [];

      // Get reviewer profiles separately
      const reviewerIds = reviews.map(r => r.reviewer_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', reviewerIds);

      return reviews.map(review => ({
        ...review,
        reviewer_profile: profiles?.find(p => p.user_id === review.reviewer_id) || 
          { full_name: null, avatar_url: null }
      }));
    },
    enabled: !!consultantUserId,
  });
}

export function useConsultantRatingStats(consultantUserId: string) {
  return useQuery({
    queryKey: ['consultant-rating-stats', consultantUserId],
    queryFn: async () => {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', consultantUserId);

      if (error) throw error;
      
      if (!reviews || reviews.length === 0) {
        return { averageRating: 0, totalReviews: 0 };
      }

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length
      };
    },
    enabled: !!consultantUserId,
  });
}