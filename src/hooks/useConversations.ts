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
      sellerId,
    }: {
      serviceId: string;
      sellerId: string;
    }) => {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          service_id: serviceId,
          seller_id: sellerId,
          buyer_id: (await supabase.auth.getUser()).data.user?.id,
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
        description: "Failed to start conversation",
        variant: "destructive",
      });
      console.error('Create conversation error:', error);
    },
  });
}

export function useExistingConversation(serviceId: string, sellerId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversation', serviceId, sellerId, user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('service_id', serviceId)
        .eq('seller_id', sellerId)
        .eq('buyer_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!serviceId && !!sellerId,
  });
}