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

        return (
          <Card 
            key={conversation.id} 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onSelectConversation(conversation)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {participantName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm truncate">
                      {participantName}
                    </h4>
                    {conversation.last_message_at && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground truncate mb-2">
                    {conversation.service?.title}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {isSellerChat ? 'Customer' : 'Service Provider'}
                    </Badge>
                    
                    <Badge 
                      variant={conversation.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {conversation.status}
                    </Badge>
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