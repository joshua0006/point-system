import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { MarketplaceHero } from '@/components/marketplace/MarketplaceHero';
import { MarketplaceFilters } from '@/components/marketplace/MarketplaceFilters';
import { MobileMarketplaceFilters } from '@/components/marketplace/MobileMarketplaceFilters';
import { ActiveFilters } from '@/components/marketplace/ActiveFilters';
import { ServicesGrid } from '@/components/marketplace/ServicesGrid';
import { useServices, useCategories } from '@/hooks/useServices';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, BarChart3, Presentation, Smartphone, GraduationCap, ExternalLink } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveContainer } from '@/components/ui/mobile-responsive';

const Services = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const isMobile = useIsMobile();
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: services = [], isLoading: servicesLoading, error: servicesError } = useServices();
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories();

  console.log('Services render - Services:', services, 'Loading:', servicesLoading, 'Error:', servicesError);
  console.log('Services render - Categories:', categories, 'Loading:', categoriesLoading, 'Error:', categoriesError);

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
    console.error('Services errors:', { servicesError, categoriesError });
    
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="container mx-auto px-4 py-16">
          <Card className="p-8 text-center border-destructive/20">
            <CardContent>
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <h3 className="text-lg font-semibold mb-2 text-destructive">
                Failed to Load Services
              </h3>
              <p className="text-muted-foreground mb-4">
                There was an error loading the services data. Please try refreshing the page.
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
        
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <h3 className="text-lg font-semibold mb-2">Loading Services...</h3>
            <p className="text-muted-foreground">Getting the latest services for you</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <MarketplaceHero servicesCount={services.length} />
      
      <ResponsiveContainer>
        <div data-services-section>
          <div className={isMobile ? "mb-4" : "mb-6 sm:mb-8"}>
            <h2 className={isMobile ? "text-xl font-bold text-foreground mb-2" : "text-2xl sm:text-3xl font-bold text-foreground mb-2"}>
              Available Services
            </h2>
            <p className={isMobile ? "text-sm text-muted-foreground" : "text-muted-foreground text-sm sm:text-base"}>
              Discover expert consultants and book services using your points
            </p>
          </div>

          {/* External Platforms Section */}
          <div className={isMobile ? "mb-6" : "mb-8"}>
            <h3 className={isMobile ? "text-lg font-semibold text-foreground mb-3" : "text-xl font-semibold text-foreground mb-4"}>
              External Platforms
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-primary/5 hover:border-primary/30 transition-all"
                onClick={() => window.open('http://track.themoneybees.co/', '_blank')}
              >
                <BarChart3 className="w-6 h-6 text-primary" />
                <div className="text-center">
                  <div className="font-medium text-sm">Track</div>
                  <div className="text-xs text-muted-foreground">MoneyBees</div>
                </div>
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-accent/5 hover:border-accent/30 transition-all"
                onClick={() => window.open('http://present.themoneybees.co/', '_blank')}
              >
                <Presentation className="w-6 h-6 text-accent" />
                <div className="text-center">
                  <div className="font-medium text-sm">Present</div>
                  <div className="text-xs text-muted-foreground">MoneyBees</div>
                </div>
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-secondary/5 hover:border-secondary/30 transition-all"
                onClick={() => window.open('https://app.themoneybees.co/', '_blank')}
              >
                <Smartphone className="w-6 h-6 text-secondary" />
                <div className="text-center">
                  <div className="font-medium text-sm">App</div>
                  <div className="text-xs text-muted-foreground">MoneyBees</div>
                </div>
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </Button>

              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-orange-500/5 hover:border-orange-500/30 transition-all"
                onClick={() => window.open('https://academy.finternship.com/', '_blank')}
              >
                <GraduationCap className="w-6 h-6 text-orange-500" />
                <div className="text-center">
                  <div className="font-medium text-sm">Academy</div>
                  <div className="text-xs text-muted-foreground">Finternship</div>
                </div>
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {isMobile ? (
            <MobileMarketplaceFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedTier={selectedTier}
              setSelectedTier={setSelectedTier}
              categories={categories}
            />
          ) : (
            <MarketplaceFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedTier={selectedTier}
              setSelectedTier={setSelectedTier}
              categories={categories}
            />
          )}

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
      </ResponsiveContainer>
    </div>
  );
};

export default Services;