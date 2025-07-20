import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useBuyerReviews(buyerUserId: string) {
  return useQuery({
    queryKey: ['buyer-reviews', buyerUserId],
    queryFn: async () => {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewee_id', buyerUserId)
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
    enabled: !!buyerUserId,
  });
}

export function useBuyerRatingStats(buyerUserId: string) {
  return useQuery({
    queryKey: ['buyer-rating-stats', buyerUserId],
    queryFn: async () => {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', buyerUserId);

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
    enabled: !!buyerUserId,
  });
}