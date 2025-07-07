
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageStatusProps {
  isOwnMessage: boolean;
  isRead: boolean;
  className?: string;
}

export function MessageStatus({ isOwnMessage, isRead, className }: MessageStatusProps) {
  // Only show status for own messages
  if (!isOwnMessage) {
    return null;
  }

  console.log('MessageStatus - isRead:', isRead);

  return (
    <div className={cn("flex items-center ml-2", className)}>
      {isRead ? (
        <CheckCheck className="h-3 w-3 text-blue-500" />
      ) : (
        <CheckCheck className="h-3 w-3 text-gray-400" />
      )}
    </div>
  );
}
