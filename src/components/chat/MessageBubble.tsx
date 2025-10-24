import { memo, useMemo } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Message } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';

interface MessageBubbleProps {
  message: Message;
}

function isEmojiOnly(text: string): boolean {
  // Remove whitespace and check if remaining characters are only emojis
  const trimmed = text.trim();
  const emojiRegex = /^[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}]+$/u;
  return emojiRegex.test(trimmed) && trimmed.length <= 6; // Max 6 emoji characters for large display
}

function formatMessageText(text: string): React.ReactNode {
  // Split text by emojis to handle mixed content
  const parts = text.split(/([\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}]+)/u);

  return parts.map((part, index) => {
    const isEmoji = /[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}]/u.test(part);

    if (isEmoji) {
      return (
        <span key={index} className="inline-block" role="img">
          {part}
        </span>
      );
    }

    return part;
  });
}

export const MessageBubble = memo(function MessageBubble({ message }: MessageBubbleProps) {
  const { user } = useAuth();
  const isOwnMessage = message.sender_id === user?.id;
  const senderName = useMemo(() =>
    message.sender_profile?.full_name || message.sender_profile?.email || 'Unknown',
    [message.sender_profile]
  );
  const isEmojiOnlyMessage = useMemo(() => isEmojiOnly(message.message_text), [message.message_text]);

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
          "relative",
          isEmojiOnlyMessage 
            ? "text-4xl leading-none p-2" 
            : "px-4 py-2 rounded-lg text-sm",
          !isEmojiOnlyMessage && (isOwnMessage 
            ? "bg-primary text-primary-foreground rounded-br-sm" 
            : "bg-muted text-foreground rounded-bl-sm")
        )}>
          {isEmojiOnlyMessage ? (
            <span className="block">{message.message_text}</span>
          ) : (
            <span className="break-words">{formatMessageText(message.message_text)}</span>
          )}
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
});
