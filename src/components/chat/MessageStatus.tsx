
import { Check, CheckCheck } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface MessageStatusProps {
  isOwnMessage: boolean;
  isRead: boolean;
  className?: string;
}

export function MessageStatus({ isOwnMessage, isRead, className }: MessageStatusProps) {
  // No visual status indicators needed
  return null;
}
