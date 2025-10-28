import { memo } from 'react';
import { OptimizedCard, OptimizedCardContent, OptimizedCardHeader } from "@/components/ui/optimized-card";
import { Badge } from "@/components/ui/badge";
import { TierBadge, TierType } from "@/components/TierBadge";
import { User, Wallet, Star, Clock } from '@/lib/icons';
import { useRoutePrefetch } from '@/hooks/useRoutePrefetch';

export interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  duration: string;
  consultant: {
    name: string;
    tier: TierType;
    avatar?: string;
  };
  bookingUrl: string;
  tags: string[];
}

interface ServiceCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  duration?: string;
  consultant: {
    name: string;
    tier: TierType;
  };
  bookingUrl: string;
  tags: string[];
  onClick: (serviceId: string) => void;
}

export const ServiceCard = memo(function ServiceCard({ 
  id, title, description, category, points, duration, consultant, bookingUrl, tags, 
  onClick 
}: ServiceCardProps) {
  const prefetchRoute = useRoutePrefetch();

  const handleMouseEnter = () => {
    prefetchRoute(`/service/${id}`);
  };

  return (
    <OptimizedCard 
      className="group border-border/50 bg-gradient-to-br from-card to-muted/20"
      onClick={() => onClick(id)}
      hoverable
      onMouseEnter={handleMouseEnter}
    >
      <OptimizedCardHeader className="pb-3">
        <div className="flex items-start justify-between mb-3">
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
          <div className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 fill-warning text-warning" />
            <span className="font-medium text-foreground">4.9</span>
            <span className="text-muted-foreground">(24)</span>
          </div>
        </div>
        
        <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm text-foreground">{consultant.name}</p>
            <div className="flex items-center space-x-2 mt-1">
              <TierBadge tier={consultant.tier} size="sm" />
              {duration && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{duration}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </OptimizedCardHeader>

      <OptimizedCardContent className="py-3">
        <p className="text-muted-foreground text-sm leading-relaxed mb-3 line-clamp-2">
          {description}
        </p>
        
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Price */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Starting at
            </div>
            <div className="flex items-center space-x-2 text-accent font-bold">
              <Wallet className="w-4 h-4" />
              <span className="text-xl">{points.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">flexi-credits</span>
            </div>
          </div>
        </div>
      </OptimizedCardContent>
    </OptimizedCard>
  );
});