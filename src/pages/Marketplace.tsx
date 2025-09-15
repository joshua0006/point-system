import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useServices } from "@/hooks/useServices";
import { MarketplaceFilters } from "@/components/marketplace/MarketplaceFilters";
import { MobileMarketplaceFilters } from "@/components/marketplace/MobileMarketplaceFilters";
import { ServicesGrid } from "@/components/marketplace/ServicesGrid";
import { MarketplaceHero } from "@/components/marketplace/MarketplaceHero";
import { ActiveFilters } from "@/components/marketplace/ActiveFilters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Loader2, Settings, Search, Megaphone, Gift } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveContainer } from '@/components/ui/mobile-responsive';
import { Button } from '@/components/ui/button';
import { SidebarLayout } from '@/components/layout/SidebarLayout';

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const isMobile = useIsMobile();
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const { data: services = [], isLoading: servicesLoading, error: servicesError } = useServices();
  const categories = []; // Simplified for now
  const categoriesLoading = false;
  const categoriesError = null;

  // Check if user is admin
  const isAdmin = profile?.role === 'admin' || profile?.role === 'master_admin';

  console.log('Marketplace render - Services:', services, 'Loading:', servicesLoading, 'Error:', servicesError);
  console.log('Marketplace render - Categories:', categories, 'Loading:', categoriesLoading, 'Error:', categoriesError);

  const handleSearchChange = (value: string) => {
    console.log('Search changed:', value);
    setSearchTerm(value);
  };

  const handleCategoryChange = (value: string) => {
    console.log('Category changed:', value);
    setSelectedCategory(value);
  };

  const handleTierChange = (value: string) => {
    console.log('Tier changed:', value);
    setSelectedTier(value);
  };

  // Filter services based on search term, category, and tier
  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || service.category_id === selectedCategory;
    const matchesTier = selectedTier === 'All'; // Simplified for now
    
    return matchesSearch && matchesCategory && matchesTier;
  });

  console.log('Filtered services:', filteredServices);

  const handleServiceBook = (serviceId: string, serviceTitle: string, servicePrice: number) => {
    console.log('Booking service:', { serviceId, serviceTitle, servicePrice });
    navigate(`/services/${serviceId}`);
  };

  // Show error state
  if (servicesError || categoriesError) {
    return (
      <SidebarLayout title="Error">
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
      </SidebarLayout>
    );
  }

  // Show loading state
  if (servicesLoading || categoriesLoading) {
    return (
      <SidebarLayout title="Loading...">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <h3 className="text-lg font-semibold mb-2">Loading Marketplace...</h3>
            <p className="text-muted-foreground">Getting the latest services for you</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout 
      title="Marketplace" 
      description="Support services for consultants - Purchase professional services to enhance your practice"
    >
      {/* Admin Dashboard Access */}
      {isAdmin && (
        <div className="bg-primary/5 border-b border-primary/10">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">Admin Access</span>
              </div>
              <Button
                onClick={() => navigate('/admin-dashboard')}
                variant="default"
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
      
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
        <div data-services-section className={isMobile ? "py-4" : "py-6 sm:py-8 border-t"}>
          {/* Filters and Services */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Desktop Filters */}
            <div className="hidden lg:block lg:w-80 flex-shrink-0">
              <div className="sticky top-20">
                <MarketplaceFilters
                  searchTerm={searchTerm}
                  onSearchChange={handleSearchChange}
                  selectedCategory={selectedCategory}
                  onCategoryChange={handleCategoryChange}
                  selectedTier={selectedTier}
                  onTierChange={handleTierChange}
                  categories={categories}
                />
              </div>
            </div>

            {/* Mobile Filters */}
            <div className="lg:hidden">
              <MobileMarketplaceFilters
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
                selectedTier={selectedTier}
                onTierChange={handleTierChange}
                categories={categories}
              />
            </div>

            {/* Services Grid */}
            <div className="flex-1">
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                    Available Services
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} available
                  </p>
                </div>
                
                {/* Active filters display */}
                <ActiveFilters
                  searchTerm={searchTerm}
                  selectedCategory={selectedCategory}
                  selectedTier={selectedTier}
                  onClearSearch={() => setSearchTerm('')}
                  onClearCategory={() => setSelectedCategory('All')}
                  onClearTier={() => setSelectedTier('All')}
                  categories={categories}
                />
              </div>

              <ServicesGrid
                services={filteredServices}
                onBookService={handleServiceBook}
                isLoading={servicesLoading}
              />
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    </SidebarLayout>
  );
};

export default Marketplace;