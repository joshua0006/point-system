import { Skeleton } from "@/components/ui/skeleton";

export const PageSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Navigation Skeleton */}
    <div className="h-16 bg-card border-b">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
    
    {/* Main Content Skeleton */}
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        {/* Content Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-4 p-6 border rounded-lg bg-card">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="pt-2">
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="h-16 bg-card border-b">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
    
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-6 border rounded-lg bg-card">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4" />
                </div>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Charts/Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="p-6 border rounded-lg bg-card">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-6 border rounded-lg bg-card">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    </div>
  </div>
);