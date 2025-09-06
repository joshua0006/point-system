
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
import { AlertCircle, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveContainer } from '@/components/ui/mobile-responsive';
import { Search, Megaphone, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const isMobile = useIsMobile();
  
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
        
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <h3 className="text-lg font-semibold mb-2">Loading Marketplace...</h3>
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
      
      {/* Quick Navigation Section */}
      <ResponsiveContainer>
        <div className={isMobile ? "py-4" : "py-6 sm:py-8"}>
          <div className={isMobile ? "mb-4" : "mb-6"}>
            <h2 className={isMobile ? "text-lg font-semibold text-foreground mb-2" : "text-xl sm:text-2xl font-semibold text-foreground mb-2"}>
              Explore Marketplace
            </h2>
            <p className={isMobile ? "text-sm text-muted-foreground" : "text-muted-foreground"}>
              Browse our different marketplace categories
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer border-2 hover:border-primary/20" onClick={() => navigate('/services')}>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-primary/20 transition-colors">
                  <Search className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Services</h3>
                <p className="text-sm text-muted-foreground mb-4">Book expert consultations and professional services</p>
                <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                  Browse Services
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer border-2 hover:border-primary/20" onClick={() => navigate('/campaigns')}>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-accent/20 transition-colors">
                  <Megaphone className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Campaigns</h3>
                <p className="text-sm text-muted-foreground mb-4">Launch marketing campaigns and promotional activities</p>
                <Button variant="outline" size="sm" className="w-full group-hover:bg-accent group-hover:text-accent-foreground">
                  View Campaigns
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer border-2 hover:border-primary/20" onClick={() => navigate('/gifting')}>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-secondary/20 transition-colors">
                  <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Gifting</h3>
                <p className="text-sm text-muted-foreground mb-4">Send thoughtful gifts to clients and partners</p>
                <Button variant="outline" size="sm" className="w-full group-hover:bg-secondary group-hover:text-secondary-foreground">
                  Browse Gifts
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </ResponsiveContainer>
      
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

export default Marketplace;
