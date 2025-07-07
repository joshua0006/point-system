
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Conversation {
  id: string;
  service_id: string;
  buyer_id: string;
  seller_id: string;
  status: 'active' | 'archived' | 'closed';
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  service?: {
    title: string;
    description: string;
  };
  buyer_profile?: {
    full_name: string | null;
    email: string;
  };
  seller_profile?: {
    full_name: string | null;
    email: string;
  };
}

export function useConversations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          service:services(title, description),
          buyer_profile:profiles!conversations_buyer_id_fkey(full_name, email),
          seller_profile:profiles!conversations_seller_id_fkey(full_name, email)
        `)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as Conversation[];
    },
    enabled: !!user,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      serviceId,
      sellerUserId,
    }: {
      serviceId: string;
      sellerUserId: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // For profile enquiries, we need to create a placeholder service or handle differently
      if (serviceId === 'profile-enquiry') {
        // First, try to find an existing general service for this consultant
        const { data: consultantServices, error: servicesError } = await supabase
          .from('services')
          .select(`
            id,
            consultants!inner(user_id)
          `)
          .eq('consultants.user_id', sellerUserId)
          .eq('is_active', true)
          .limit(1);

        if (servicesError) {
          console.error('Error fetching consultant services:', servicesError);
          throw new Error('Could not find consultant services');
        }

        // If consultant has services, use the first one
        if (consultantServices && consultantServices.length > 0) {
          const { data, error } = await supabase
            .from('conversations')
            .insert({
              service_id: consultantServices[0].id,
              seller_id: sellerUserId,
              buyer_id: user.id,
            })
            .select()
            .single();

          if (error) throw error;
          return data;
        } else {
          // If no services found, we can't create a conversation
          throw new Error('Cannot start conversation - consultant has no active services');
        }
      }

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          service_id: serviceId,
          seller_id: sellerUserId,
          buyer_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start conversation",
        variant: "destructive",
      });
      console.error('Create conversation error:', error);
    },
  });
}

export function useExistingConversation(serviceId: string, sellerUserId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversation', serviceId, sellerUserId, user?.id],
    queryFn: async () => {
      if (!user) return null;

      // For profile enquiries, find any conversation with this seller
      if (serviceId === 'profile-enquiry') {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('seller_id', sellerUserId)
          .eq('buyer_id', user.id)
          .maybeSingle();

        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('service_id', serviceId)
        .eq('seller_id', sellerUserId)
        .eq('buyer_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!serviceId && !!sellerUserId,
  });
}
