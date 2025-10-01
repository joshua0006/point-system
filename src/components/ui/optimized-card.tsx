import { memo, forwardRef, ReactNode, HTMLAttributes } from 'react';
import { Card, CardContent, CardHeader } from './card';
import { cn } from '@/lib/utils';

interface OptimizedCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

const OptimizedCardComponent = forwardRef<HTMLDivElement, OptimizedCardProps>(({
  children,
  className,
  onClick,
  hoverable = false,
  ...props
}, ref) => {
  return (
    <Card 
      ref={ref}
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

OptimizedCardComponent.displayName = 'OptimizedCard';

export const OptimizedCard = memo(OptimizedCardComponent);
export const OptimizedCardHeader = memo(CardHeader);
export const OptimizedCardContent = memo(CardContent);