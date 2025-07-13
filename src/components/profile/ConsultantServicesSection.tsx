
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  duration_minutes: number | null;
  categories: {
    name: string;
  } | null;
}

interface ConsultantServicesSectionProps {
  services: Service[] | undefined;
  onServiceDetails: (serviceId: string) => void;
  onAllServicesClick: () => void;
}

export function ConsultantServicesSection({ 
  services, 
  onServiceDetails, 
  onAllServicesClick 
}: ConsultantServicesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Available Services
        </CardTitle>
      </CardHeader>
      <CardContent>
        {services && services.length > 0 ? (
          <div className="space-y-4">
            {services.slice(0, 3).map((service) => (
              <div key={service.id} className="p-4 rounded-lg border bg-card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-foreground">{service.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {service.description.substring(0, 100)}...
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="secondary">{service.categories?.name || 'General'}</Badge>
                      {service.duration_minutes && (
                        <Badge variant="outline">{service.duration_minutes} min</Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 font-semibold text-accent">
                    <span>{service.price} points</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onServiceDetails(service.id)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
            {services.length > 3 && (
              <div className="text-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={onAllServicesClick}
                  className="w-full"
                >
                  View All Services ({services.length})
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No services available at the moment</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
