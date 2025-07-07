
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Message } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { user } = useAuth();
  const isOwnMessage = message.sender_id === user?.id;
  const senderName = message.sender_profile?.full_name || message.sender_profile?.email || 'Unknown';

  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isOwnMessage ? "flex-row-reverse" : "flex-row"
    )}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {senderName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn(
        "max-w-[70%] space-y-1",
        isOwnMessage ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "px-4 py-2 rounded-lg text-sm relative",
          isOwnMessage 
            ? "bg-primary text-primary-foreground rounded-br-sm" 
            : "bg-muted text-foreground rounded-bl-sm"
        )}>
          {message.message_text}
        </div>
        
        <div className={cn(
          "flex items-center gap-1 text-xs text-muted-foreground",
          isOwnMessage ? "justify-end" : "justify-start"
        )}>
          <span>
            {new Date(message.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
