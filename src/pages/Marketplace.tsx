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
import { useChunkPrefetch } from '@/hooks/useChunkPrefetch';

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const isMobile = useIsMobile();

  // Prefetch likely next pages from marketplace
  useChunkPrefetch({
    imports: [
      () => import('@/pages/ServiceDetail'),
      () => import('@/pages/Services'),
    ],
    priority: 'low',
    delay: 2000,
  });
  
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
      
      {/* Simple Services Section */}
      <ResponsiveContainer>
        <div className={isMobile ? "py-4" : "py-6 sm:py-8 border-t"}>
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
              Available Services
            </h2>
            <p className="text-muted-foreground">
              {services.length} service{services.length !== 1 ? 's' : ''} available
            </p>
          </div>
          
          <ServicesGrid
            services={services}
            totalServices={services.length}
            onServiceClick={(serviceId) => navigate(`/services/${serviceId}`)}
            onClearAllFilters={() => {
              setSearchTerm('');
              setSelectedCategory('All');
              setSelectedTier('All');
            }}
          />
        </div>
      </ResponsiveContainer>
    </SidebarLayout>
  );
};

export default Marketplace;