import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SendAutoReplyParams {
  conversationId: string;
  sellerId: string;
}

export function useAutoReply() {
  const { toast } = useToast();

  const sendAutoReply = useMutation({
    mutationFn: async ({ conversationId, sellerId }: SendAutoReplyParams) => {
      // First, check if the consultant has auto-reply enabled
      const { data: consultant, error: consultantError } = await supabase
        .from('consultants')
        .select('auto_reply_enabled, auto_reply_message, user_id')
        .eq('user_id', sellerId)
        .single();

      if (consultantError) {
        console.error('Error fetching consultant auto-reply settings:', consultantError);
        return;
      }

      // If auto-reply is not enabled or no message is set, don't send anything
      if (!consultant.auto_reply_enabled || !consultant.auto_reply_message) {
        return;
      }

      // Check if there are already messages in this conversation
      // We only want to send auto-reply for the very first message
      const { data: existingMessages, error: messagesError } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .limit(1);

      if (messagesError) {
        console.error('Error checking existing messages:', messagesError);
        return;
      }

      // If there are already messages, don't send auto-reply
      if (existingMessages && existingMessages.length > 0) {
        return;
      }

      // Send the auto-reply message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: sellerId,
          message_text: consultant.auto_reply_message,
          message_type: 'text',
        });

      if (messageError) {
        console.error('Error sending auto-reply:', messageError);
        throw messageError;
      }

      return { success: true };
    },
    onError: (error) => {
      console.error('Auto-reply error:', error);
      // Don't show toast for auto-reply errors to avoid spamming users
      // toast({
      //   title: "Auto-reply failed",
      //   description: "Failed to send automated response",
      //   variant: "destructive",
      // });
    },
  });

  return {
    sendAutoReply: sendAutoReply.mutate,
    isLoading: sendAutoReply.isPending,
  };
}