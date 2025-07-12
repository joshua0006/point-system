
import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { MarketplaceHero } from '@/components/marketplace/MarketplaceHero';
import { MarketplaceFilters } from '@/components/marketplace/MarketplaceFilters';
import { ActiveFilters } from '@/components/marketplace/ActiveFilters';
import { ServicesGrid } from '@/components/marketplace/ServicesGrid';
import { ServicesGridSkeleton } from '@/components/marketplace/LoadingSkeleton';
import { useServices, useCategories } from '@/hooks/useServices';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: services = [], isLoading: servicesLoading, error: servicesError } = useServices();
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories();

  console.log('Marketplace render - Services:', services, 'Loading:', servicesLoading, 'Error:', servicesError);
  console.log('Marketplace render - Categories:', categories, 'Loading:', categoriesLoading, 'Error:', categoriesError);

  const filteredServices = services.filter(service => {
    const consultantName = service.consultant?.profiles?.full_name || 
                          service.consultant?.profiles?.email || 
                          'Unknown Consultant';
    
    const matchesSearch = !searchTerm || 
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultantName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || 
      service.categories?.name === selectedCategory;
    
    const matchesTier = selectedTier === "All" || 
      service.consultant?.tier === selectedTier.toLowerCase();
    
    return matchesSearch && matchesCategory && matchesTier;
  });

  const handleServiceClick = (serviceId: string) => {
    navigate(`/service/${serviceId}`);
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedTier('All');
  };

  // Show error state if there are critical errors
  if (servicesError || categoriesError) {
    console.error('Marketplace errors:', { servicesError, categoriesError });
    
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="container mx-auto px-4 py-16">
          <Card className="p-8 text-center border-destructive/20">
            <CardContent>
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <h3 className="text-lg font-semibold mb-2 text-destructive">
                Failed to Load Marketplace
              </h3>
              <p className="text-muted-foreground mb-4">
                There was an error loading the marketplace data. Please try refreshing the page.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Refresh Page
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show loading state
  if (servicesLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <MarketplaceHero servicesCount={0} />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="h-8 w-64 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-96 bg-muted animate-pulse rounded" />
          </div>
          <div className="mb-8">
            <div className="h-20 bg-muted/30 rounded-lg animate-pulse" />
          </div>
          <ServicesGridSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <MarketplaceHero servicesCount={services.length} />
      
      <div className="container mx-auto px-4 py-8" data-services-section>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Available Services
          </h2>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Discover expert consultants and book services using your points
            </p>
            <div className="text-sm text-muted-foreground">
              {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        <MarketplaceFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedTier={selectedTier}
          setSelectedTier={setSelectedTier}
          categories={categories}
        />

        <ActiveFilters
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          selectedTier={selectedTier}
          onClearSearch={() => setSearchTerm('')}
          onClearCategory={() => setSelectedCategory('All')}
          onClearTier={() => setSelectedTier('All')}
        />

        <ServicesGrid
          services={filteredServices}
          totalServices={services.length}
          onServiceClick={handleServiceClick}
          onClearAllFilters={handleClearAllFilters}
        />
      </div>
    </div>
  );
};

export default Marketplace;
