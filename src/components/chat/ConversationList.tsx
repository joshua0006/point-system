
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Conversation } from '@/hooks/useConversations';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
}

export function ConversationList({ conversations, onSelectConversation }: ConversationListProps) {
  const { user } = useAuth();

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No conversations yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Start chatting with sellers about their services
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {conversations.map((conversation) => {
        const otherParticipant = conversation.buyer_id === user?.id 
          ? conversation.seller_profile 
          : conversation.buyer_profile;
        
        const participantName = otherParticipant?.full_name || otherParticipant?.email || 'Unknown';
        const isSellerChat = conversation.seller_id === user?.id;
        const hasUnreadMessages = (conversation.unread_count || 0) > 0;
        const lastMessage = conversation.last_message;

        // Check if message text is long enough to need truncation
        const messageText = lastMessage 
          ? `${lastMessage.sender_id === user?.id ? 'You: ' : ''}${lastMessage.message_text}`
          : '';
        const isTextLong = messageText.length > 50; // Approximate threshold for truncation

        return (
          <Card 
            key={conversation.id} 
            className={`cursor-pointer hover:bg-muted/50 transition-colors ${hasUnreadMessages ? 'ring-2 ring-primary/20' : ''}`}
            onClick={() => onSelectConversation(conversation)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {participantName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {hasUnreadMessages && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 flex justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-semibold text-sm truncate ${hasUnreadMessages ? 'text-foreground' : 'text-foreground/80'}`}>
                        {participantName}
                      </h4>
                      <Badge 
                        variant={conversation.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {conversation.status}
                      </Badge>
                      {hasUnreadMessages && (
                        <Badge variant="destructive" className="text-xs px-1.5 py-0.5 h-5">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground truncate mb-2">
                      {conversation.service?.title}
                    </p>
                    
                    <div className="flex items-center">
                      <Badge variant="secondary" className="text-xs">
                        {isSellerChat ? 'Customer' : 'Service Provider'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end justify-between ml-4 min-w-0 max-w-[40%]">
                    {conversation.last_message_at && (
                      <span className="text-xs text-muted-foreground mb-2">
                        {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                      </span>
                    )}
                    
                    {lastMessage && (
                      <div className="text-right bg-muted/30 rounded-lg px-3 py-2 border w-full relative overflow-hidden">
                        <p className={`text-sm ${hasUnreadMessages ? 'font-semibold text-foreground' : 'font-medium text-foreground/90'} relative`}>
                          <span className="block truncate">
                            {lastMessage.sender_id === user?.id ? 'You: ' : ''}
                            {lastMessage.message_text}
                          </span>
                          {isTextLong && (
                            <span className="absolute right-0 bottom-0 bg-gradient-to-l from-muted/30 via-muted/30 to-transparent w-8 h-full flex items-end justify-end text-xs opacity-60">
                              ...
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
