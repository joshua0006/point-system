import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { BookingWithDetails } from '@/types/booking';

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
          .select(`
            *,
            consultants!inner(user_id)
          `)
          .eq('id', bookingId)
          .single();

        if (fetchError) throw fetchError;

        // Determine if user is buyer or consultant
        const isBuyer = user.id === booking.user_id;
        const isConsultant = user.id === booking.consultants.user_id;
        
        console.log('Completion debug:', {
          userId: user.id,
          bookingUserId: booking.user_id,
          consultantUserId: booking.consultants.user_id,
          isBuyer,
          isConsultant,
          currentBuyerCompleted: booking.buyer_completed,
          currentConsultantCompleted: booking.consultant_completed
        });
        
        if (!isBuyer && !isConsultant) {
          throw new Error('User is not authorized to update this booking');
        }

        const updateData: any = {};

        if (isBuyer) {
          updateData.buyer_completed = true;
          console.log('Buyer completing, consultant already completed:', booking.consultant_completed);
        } else if (isConsultant) {
          updateData.consultant_completed = true;
          console.log('Consultant completing, buyer already completed:', booking.buyer_completed);
        }

        // Check if both parties will have completed after this update
        const bothWillBeCompleted = isBuyer 
          ? booking.consultant_completed  // buyer is completing now, check if consultant already completed
          : booking.buyer_completed;      // consultant is completing now, check if buyer already completed

        console.log('Both will be completed check:', bothWillBeCompleted);

        if (bothWillBeCompleted) {
          updateData.status = 'completed';
          console.log('Setting status to completed');
        }

        console.log('Update data:', updateData);

        const { data, error } = await supabase
          .from('bookings')
          .update(updateData)
          .eq('id', bookingId)
          .select()
          .maybeSingle();

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
          .maybeSingle();

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