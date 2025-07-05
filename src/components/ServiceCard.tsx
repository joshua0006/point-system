import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TierBadge, TierType } from "@/components/TierBadge";
import { Calendar, User, Wallet } from "lucide-react";

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
  service: Service;
  onPurchase?: (serviceId: string) => void;
}

export function ServiceCard({ service, onPurchase }: ServiceCardProps) {
  const handlePurchase = () => {
    onPurchase?.(service.id);
  };

  const handleBooking = () => {
    window.open(service.bookingUrl, '_blank');
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 bg-gradient-to-br from-card to-muted/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
              {service.title}
            </h3>
            <Badge variant="secondary" className="mb-2">
              {service.category}
            </Badge>
          </div>
          <div className="flex items-center space-x-2 text-accent font-bold">
            <Wallet className="w-4 h-4" />
            <span>{service.points.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm text-foreground">{service.consultant.name}</p>
            <div className="flex items-center space-x-2 mt-1">
              <TierBadge tier={service.consultant.tier} size="sm" />
              <span className="text-xs text-muted-foreground">• {service.duration}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-3">
        <p className="text-muted-foreground text-sm leading-relaxed mb-3">
          {service.description}
        </p>
        
        {service.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {service.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 flex space-x-2">
        <Button 
          onClick={handlePurchase} 
          className="flex-1"
          size="sm"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Purchase
        </Button>
        <Button 
          onClick={handleBooking}
          variant="outline" 
          size="sm"
          className="flex items-center space-x-2"
        >
          <Calendar className="w-4 h-4" />
          <span>Book</span>
        </Button>
      </CardFooter>
    </Card>
  );
}