
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Target } from '@/lib/icons';

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

interface AllServicesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: Service[];
  consultantName: string;
  onServiceDetails: (serviceId: string) => void;
}

export function AllServicesModal({ 
  open, 
  onOpenChange, 
  services, 
  consultantName, 
  onServiceDetails 
}: AllServicesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-primary" />
            <span>All Services by {consultantName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {services.length > 0 ? (
            services.map((service) => (
              <Card key={service.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground mb-2">
                        {service.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                        {service.description}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {service.categories?.name || 'General'}
                        </Badge>
                        {service.duration_minutes && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {service.duration_minutes} min
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center space-x-1 font-semibold text-accent">
                      <span className="text-xl">{service.price}</span>
                      <span className="text-sm text-muted-foreground">points</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onServiceDetails(service.id)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="w-16 h-16 mx-auto mb-6 opacity-30" />
              <h3 className="text-xl font-medium mb-2">No Services Available</h3>
              <p className="text-sm">
                This consultant hasn't added any services yet
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
