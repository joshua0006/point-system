
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Conversation, useArchiveConversation, useUnarchiveConversation } from '@/hooks/useConversations';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { MoreVertical, Archive, ArchiveX } from 'lucide-react';

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
  activeFilter: string;
}

export function ConversationList({ conversations, onSelectConversation, activeFilter }: ConversationListProps) {
  const { user } = useAuth();
  const archiveConversation = useArchiveConversation();
  const unarchiveConversation = useUnarchiveConversation();
  const [selectedDropdown, setSelectedDropdown] = useState<string | null>(null);

  const handleArchive = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    archiveConversation.mutate(conversationId);
    setSelectedDropdown(null);
  };

  const handleUnarchive = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    unarchiveConversation.mutate(conversationId);
    setSelectedDropdown(null);
  };

  const getEmptyMessage = () => {
    switch (activeFilter) {
      case 'active':
        return {
          title: 'No active conversations',
          subtitle: 'Active conversations will appear here when bookings are confirmed'
        };
      case 'waiting_acceptance':
        return {
          title: 'No pending conversations', 
          subtitle: 'Conversations awaiting booking confirmation will appear here'
        };
      case 'archive':
        return {
          title: 'No archived conversations',
          subtitle: 'Conversations you archive will appear here'
        };
      default:
        return {
          title: 'No conversations yet',
          subtitle: 'Start chatting with sellers about their services'
        };
    }
  };

  if (conversations.length === 0) {
    const emptyMessage = getEmptyMessage();
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{emptyMessage.title}</p>
        <p className="text-sm text-muted-foreground mt-2">
          {emptyMessage.subtitle}
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

        // Create the message text
        const messageText = lastMessage 
          ? `${lastMessage.sender_id === user?.id ? 'You: ' : ''}${lastMessage.message_text}`
          : '';

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
                
                <div className="flex-1 min-w-0 flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-semibold text-sm truncate ${hasUnreadMessages ? 'text-foreground' : 'text-foreground/80'}`}>
                        {participantName}
                      </h4>
                      
                      {/* Show booking status badge if available */}
                      {conversation.booking && (
                        <Badge 
                          variant={conversation.booking.status === 'confirmed' ? 'default' : 
                                   conversation.booking.status === 'pending' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {conversation.booking.status}
                        </Badge>
                      )}
                      
                      {conversation.manual_archive && (
                        <Badge variant="outline" className="text-xs">
                          <Archive className="w-3 h-3 mr-1" />
                          Archived
                        </Badge>
                      )}
                      
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
                  
                  <div className="flex items-start justify-between ml-4 min-w-0 max-w-[50%] flex-shrink-0">
                    <div className="flex flex-col items-end w-full">
                      {conversation.last_message_at && (
                        <span className="text-xs text-muted-foreground mb-2">
                          {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                        </span>
                      )}
                      
                      {lastMessage && (
                        <div className="text-right bg-muted/30 rounded-lg px-3 py-2 border max-w-full">
                          <p className={`text-sm ${hasUnreadMessages ? 'font-semibold text-foreground' : 'font-medium text-foreground/90'} truncate max-w-full`}>
                            {messageText}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Archive/Unarchive dropdown */}
                    <DropdownMenu 
                      open={selectedDropdown === conversation.id} 
                      onOpenChange={(open) => setSelectedDropdown(open ? conversation.id : null)}
                    >
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background border shadow-md">
                        {conversation.manual_archive ? (
                          <DropdownMenuItem onClick={(e) => handleUnarchive(conversation.id, e)}>
                            <ArchiveX className="w-4 h-4 mr-2" />
                            Unarchive
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={(e) => handleArchive(conversation.id, e)}>
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
