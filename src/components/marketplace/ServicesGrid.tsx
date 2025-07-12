import { ServiceCard } from '@/components/ServiceCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { Service } from '@/hooks/useServices';

interface ServicesGridProps {
  services: Service[];
  totalServices: number;
  onServiceClick: (serviceId: string) => void;
  onClearAllFilters: () => void;
}

export function ServicesGrid({ 
  services, 
  totalServices, 
  onServiceClick, 
  onClearAllFilters 
}: ServicesGridProps) {
  if (services.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CardContent>
          <div className="text-muted-foreground mb-4">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No services found</h3>
            <p>Try adjusting your search criteria or filters</p>
          </div>
          <Button variant="outline" onClick={onClearAllFilters}>
            Clear all filters
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => {
          const isNew = new Date(service.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
          
          return (
            <div key={service.id} className="relative">
              {isNew && (
                <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-medium px-2 py-1 rounded-full shadow-lg">
                  New
                </div>
              )}
              <ServiceCard
                id={service.id}
                title={service.title}
                description={service.description}
                category={service.categories?.name || 'Uncategorized'}
                points={service.price}
                duration={service.duration_minutes ? `${service.duration_minutes} mins` : undefined}
                consultant={{
                  name: service.consultant?.profiles?.full_name || 
                        service.consultant?.profiles?.email || 
                        'Unknown Consultant',
                  tier: service.consultant?.tier || 'bronze',
                }}
                bookingUrl={service.consultant?.calendar_link || ''}
                tags={[]}
                onClick={onServiceClick}
              />
            </div>
          );
        })}
      </div>

      {/* Results Summary */}
      {services.length > 0 && (
        <div className="text-center mt-8 p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{services.length}</span> of{' '}
            <span className="font-medium text-foreground">{totalServices}</span> available services
          </p>
        </div>
      )}
    </div>
  );
}