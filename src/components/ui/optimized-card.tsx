import { memo, ReactNode, HTMLAttributes } from 'react';
import { Card, CardContent, CardHeader } from './card';
import { cn } from '@/lib/utils';

interface OptimizedCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const OptimizedCard = memo(function OptimizedCard({
  children,
  className,
  onClick,
  hoverable = false,
  ...props
}: OptimizedCardProps) {
  return (
    <Card 
      className={cn(
        'transition-all duration-200',
        hoverable && 'hover:shadow-lg hover:-translate-y-1 cursor-pointer',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </Card>
  );
});

export const OptimizedCardHeader = memo(CardHeader);
export const OptimizedCardContent = memo(CardContent);