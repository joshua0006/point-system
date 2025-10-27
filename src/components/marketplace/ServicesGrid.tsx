import { ServiceCard } from '@/components/ServiceCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from '@/lib/icons';
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
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
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
        ))}
      </div>

      {services.length > 0 && (
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Showing {services.length} of {totalServices} services
          </p>
        </div>
      )}
    </>
  );
}