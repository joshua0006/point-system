
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  message_type: 'text' | 'system_notification';
  read_at: string | null;
  created_at: string;
  sender_profile?: {
    full_name: string | null;
    email: string;
  };
}

export function useMessages(conversationId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey(full_name, email)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversationId && !!user,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      conversationId,
      messageText,
    }: {
      conversationId: string;
      messageText: string;
    }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          message_text: messageText,
          message_type: 'text',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      console.error('Send message error:', error);
    },
  });
}

export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .is('read_at', null);

      if (error) throw error;
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
}

export function useUnreadMessageCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      // First get all conversation IDs for the user
      const { data: conversations, error: conversationError } = await supabase
        .from('conversations')
        .select('id')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

      if (conversationError) throw conversationError;

      if (!conversations || conversations.length === 0) return 0;

      // Extract conversation IDs
      const conversationIds = conversations.map(conv => conv.id);

      // For each conversation, check if the last message is from someone else
      // and count unread messages only from those conversations
      let totalUnreadCount = 0;

      for (const conversationId of conversationIds) {
        // Get the last message of this conversation
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('sender_id')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Only count unread messages if the last message is from someone else
        if (lastMessage && lastMessage.sender_id !== user.id) {
          const { data: unreadMessages } = await supabase
            .from('messages')
            .select('id', { count: 'exact' })
            .eq('conversation_id', conversationId)
            .neq('sender_id', user.id)
            .is('read_at', null);

          totalUnreadCount += unreadMessages?.length || 0;
        }
      }

      return totalUnreadCount;
    },
    enabled: !!user,
  });
}

export function useRealtimeMessages(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // If someone else sent a message, mark all their previous unread messages as read
          // because the current user is now seeing them
          if (payload.new.sender_id !== user.id) {
            await supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('conversation_id', conversationId)
              .neq('sender_id', user.id)
              .is('read_at', null);
          }
          
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          queryClient.invalidateQueries({ queryKey: ['unread-count'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // If someone else sent a message, mark all their previous unread messages as read
          if (payload.new.sender_id !== user.id) {
            await supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('conversation_id', conversationId)
              .neq('sender_id', user.id)
              .is('read_at', null);
          }
          
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          queryClient.invalidateQueries({ queryKey: ['unread-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, queryClient]);
}
