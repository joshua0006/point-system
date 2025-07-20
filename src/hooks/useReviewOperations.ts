import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Review } from '@/types/booking';

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

export function useBookingReviews(bookingId: string) {
  return useQuery({
    queryKey: ['reviews', bookingId],
    queryFn: async () => {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!reviews) return [];

      // Get reviewer profiles separately
      const reviewerIds = reviews.map(r => r.reviewer_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', reviewerIds);

      return reviews.map(review => ({
        ...review,
        reviewer_profile: profiles?.find(p => p.user_id === review.reviewer_id) || 
          { full_name: null, email: 'Unknown' }
      })) as Review[];
    },
    enabled: !!bookingId,
  });
}