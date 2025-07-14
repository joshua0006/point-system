import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface BookingWithDetails {
  id: string;
  user_id: string;
  consultant_id: string;
  service_id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  points_spent: number;
  created_at: string;
  scheduled_at: string | null;
  notes: string | null;
  buyer_completed: boolean;
  consultant_completed: boolean;
  services: {
    title: string;
    description: string;
    price: number;
    duration_minutes: number | null;
    image_url: string | null;
  };
  buyer_profile: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  consultant_profile: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_profile: {
    full_name: string | null;
    email: string;
  };
}

export function useBookingForConversation(conversationId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversation-booking', conversationId],
    queryFn: async () => {
      if (!user) return null;

      // First get the conversation to get the service_id
      const { data: conversation } = await supabase
        .from('conversations')
        .select('service_id, buyer_id, seller_id')
        .eq('id', conversationId)
        .single();

      if (!conversation) return null;

      // Find the booking for this service and these participants
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services!inner(title, description, price, duration_minutes, image_url)
        `)
        .eq('service_id', conversation.service_id)
        .eq('user_id', conversation.buyer_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!booking) return null;

      // Get buyer profile
      const { data: buyerProfile } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url')
        .eq('user_id', conversation.buyer_id)
        .single();

      // Get consultant profile through the consultants table
      const { data: consultant } = await supabase
        .from('consultants')
        .select('user_id')
        .eq('id', booking.consultant_id)
        .single();

      let consultantProfile = null;
      if (consultant) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, avatar_url')
          .eq('user_id', consultant.user_id)
          .single();
        consultantProfile = profile;
      }

      return {
        ...booking,
        buyer_profile: buyerProfile || { full_name: null, email: '', avatar_url: null },
        consultant_profile: consultantProfile || { full_name: null, email: '', avatar_url: null }
      } as BookingWithDetails;
    },
    enabled: !!user && !!conversationId,
  });
}

export function useUpdateBookingStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      bookingId, 
      status, 
      scheduledAt 
    }: { 
      bookingId: string; 
      status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
      scheduledAt?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // For completion, we need special handling
      if (status === 'completed') {
        // First get the current booking to check who is completing
        const { data: booking, error: fetchError } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (fetchError) throw fetchError;

        // Determine if user is buyer or consultant
        const isBuyer = user.id === booking.user_id;
        const updateData: any = {};

        if (isBuyer) {
          updateData.buyer_completed = true;
        } else {
          updateData.consultant_completed = true;
        }

        // Check if both parties have completed after this update
        const bothCompleted = isBuyer 
          ? (booking.consultant_completed && true) 
          : (booking.buyer_completed && true);

        if (bothCompleted) {
          updateData.status = 'completed';
        }

        const { data, error } = await supabase
          .from('bookings')
          .update(updateData)
          .eq('id', bookingId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // For other status changes, use original logic
        const updateData: any = { status };
        if (scheduledAt) {
          updateData.scheduled_at = scheduledAt;
        }

        const { data, error } = await supabase
          .from('bookings')
          .update(updateData)
          .eq('id', bookingId)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-booking'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: "Status Updated",
        description: "Booking status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update booking status",
        variant: "destructive",
      });
    },
  });
}

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