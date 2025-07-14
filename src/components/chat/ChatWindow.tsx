
import { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { BookingCard } from './BookingCard';
import { useMessages, useSendMessage, useRealtimeMessages } from '@/hooks/useMessages';
import { Conversation } from '@/hooks/useConversations';
import { useBookingForConversation } from '@/hooks/useBookingManagement';
import { useAuth } from '@/contexts/AuthContext';

interface ChatWindowProps {
  conversation: Conversation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatWindow({ conversation, open, onOpenChange }: ChatWindowProps) {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { data: messages = [], isLoading } = useMessages(conversation?.id);
  const { data: booking } = useBookingForConversation(conversation?.id || '');
  const sendMessageMutation = useSendMessage();
  
  // Enable real-time updates
  useRealtimeMessages(conversation?.id);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (messageText: string) => {
    if (!conversation) return;
    
    sendMessageMutation.mutate({
      conversationId: conversation.id,
      messageText,
    });
  };

  if (!conversation) return null;

  const otherParticipant = conversation.buyer_id === user?.id 
    ? conversation.seller_profile 
    : conversation.buyer_profile;

  const participantName = otherParticipant?.full_name || otherParticipant?.email || 'Unknown';

  // Handle profile enquiry title
  const conversationTitle = conversation.service_id === 'profile-enquiry' 
    ? 'Enquiry' 
    : conversation.service?.title || 'Chat';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-left">
            Chat with {participantName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-left">
            About: {conversationTitle}
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="py-4">
            {/* Show booking card if there's an associated booking */}
            {booking && <BookingCard booking={booking} />}
            
            {isLoading ? (
              <div className="text-center text-muted-foreground">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <MessageInput 
          onSendMessage={handleSendMessage}
          disabled={sendMessageMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
