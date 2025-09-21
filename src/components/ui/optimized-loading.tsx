import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const OptimizedLoadingCard = memo(function OptimizedLoadingCard() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
});

export const OptimizedLoadingGrid = memo(function OptimizedLoadingGrid({ 
  count = 6 
}: { 
  count?: number 
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <OptimizedLoadingCard key={i} />
      ))}
    </div>
  );
});

export const OptimizedLoadingList = memo(function OptimizedLoadingList({ 
  count = 5 
}: { 
  count?: number 
}) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
});

export const OptimizedLoadingTable = memo(function OptimizedLoadingTable({ 
  rows = 5, 
  cols = 4 
}: { 
  rows?: number; 
  cols?: number 
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-4 pb-2">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-8 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
});