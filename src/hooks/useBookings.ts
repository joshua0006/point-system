import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useBookService = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId, consultantId, price }: { 
      serviceId: string; 
      consultantId: string; 
      price: number;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Check if user has enough points
      const { data: profile } = await supabase
        .from('profiles')
        .select('points_balance')
        .eq('user_id', user.id)
        .single();

      if (!profile || profile.points_balance < price) {
        throw new Error('Insufficient points');
      }

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          service_id: serviceId,
          consultant_id: consultantId,
          points_spent: price,
          status: 'pending'
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Update user points
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          points_balance: profile.points_balance - price 
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          user_id: user.id,
          type: 'purchase',
          amount: -price,
          description: `Service booking: ${serviceId}`,
          booking_id: booking.id
        });

      if (transactionError) throw transactionError;

      return booking;
    },
    onSuccess: () => {
      toast({
        title: "Service booked successfully!",
        description: "Check your dashboard for booking details.",
      });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUserBookings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (
            title,
            description
          ),
          consultants (
            tier,
            profiles:profiles (
              full_name,
              email
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};