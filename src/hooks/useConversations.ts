
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Conversation {
  id: string;
  service_id: string;
  buyer_id: string;
  seller_id: string;
  status: 'active' | 'archived' | 'closed' | 'waiting_acceptance';
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  manual_archive: boolean;
  archived_by: string | null;
  archived_at: string | null;
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
  booking?: {
    id: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    buyer_completed: boolean;
    consultant_completed: boolean;
  };
  last_message?: {
    message_text: string;
    sender_id: string;
    created_at: string;
  };
  unread_count?: number;
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
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Get last message, unread count, and booking info for each conversation
      const conversationsWithMessages = await Promise.all(
        (data || []).map(async (conversation) => {
          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('message_text, sender_id, created_at')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get booking info for this conversation/service
          const { data: booking } = await supabase
            .from('bookings')
            .select('id, status, buyer_completed, consultant_completed')
            .eq('service_id', conversation.service_id)
            .or(`user_id.eq.${user.id},consultant_id.in.(select id from consultants where user_id = '${user.id}')`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Only count unread messages that are NOT from the current user
          // AND only if the last message is from someone else
          let unreadCount = 0;
          if (lastMessage && lastMessage.sender_id !== user.id) {
            const { data: unreadMessages } = await supabase
              .from('messages')
              .select('id', { count: 'exact' })
              .eq('conversation_id', conversation.id)
              .neq('sender_id', user.id)
              .is('read_at', null);

            unreadCount = unreadMessages?.length || 0;
          }

          return {
            ...conversation,
            last_message: lastMessage,
            unread_count: unreadCount,
            booking: booking || undefined,
          };
        })
      );

      return conversationsWithMessages as Conversation[];
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

      // Always create a new conversation for each purchase/booking
      // This ensures separate conversations for each transaction

      // Create new conversation
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

export function useArchiveConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('conversations')
        .update({
          manual_archive: true,
          archived_by: user.id,
          archived_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({
        title: "Success",
        description: "Conversation archived successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to archive conversation",
        variant: "destructive",
      });
    },
  });
}

export function useUnarchiveConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { data, error } = await supabase
        .from('conversations')
        .update({
          manual_archive: false,
          archived_by: null,
          archived_at: null,
        })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({
        title: "Success",
        description: "Conversation unarchived successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unarchive conversation", 
        variant: "destructive",
      });
    },
  });
}
