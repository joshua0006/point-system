import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Review } from '@/types/booking';

// Generic review hook that can be used for both buyers and consultants
export function useReviews(userId: string, type: 'buyer' | 'consultant' | 'booking' = 'consultant') {
  return useQuery({
    queryKey: [`${type}-reviews`, userId],
    queryFn: async () => {
      const column = type === 'booking' ? 'booking_id' : 'reviewee_id';
      
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*')
        .eq(column, userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!reviews) return [];

      // Get reviewer profiles separately
      const reviewerIds = reviews.map(r => r.reviewer_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, email')
        .in('user_id', reviewerIds);

      return reviews.map(review => ({
        ...review,
        reviewer_profile: profiles?.find(p => p.user_id === review.reviewer_id) || 
          { full_name: null, avatar_url: null, email: 'Unknown' }
      })) as Review[];
    },
    enabled: !!userId,
  });
}

// Rating statistics hook
export function useRatingStats(userId: string, type: 'buyer' | 'consultant' = 'consultant') {
  return useQuery({
    queryKey: [`${type}-rating-stats`, userId],
    queryFn: async () => {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', userId);

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
    enabled: !!userId,
  });
}

// Create review mutation
export function useCreateReview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      revieweeId,
      rating,
      comment,
    }: {
      bookingId: string;
      revieweeId: string;
      rating: number;
      comment?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          booking_id: bookingId,
          reviewer_id: user.id,
          reviewee_id: revieweeId,
          rating,
          comment,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['consultant-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['buyer-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['booking-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['consultant-rating-stats'] });
      queryClient.invalidateQueries({ queryKey: ['buyer-rating-stats'] });
      toast({
        title: "Review Submitted",
        description: "Your review has been submitted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });
}

// Legacy compatibility exports
export const useBuyerReviews = (userId: string) => useReviews(userId, 'buyer');
export const useConsultantReviews = (userId: string) => useReviews(userId, 'consultant');
export const useBookingReviews = (bookingId: string) => useReviews(bookingId, 'booking');
export const useBuyerRatingStats = (userId: string) => useRatingStats(userId, 'buyer');
export const useConsultantRatingStats = (userId: string) => useRatingStats(userId, 'consultant');