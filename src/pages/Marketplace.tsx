import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { MarketplaceHero } from '@/components/marketplace/MarketplaceHero';
import { MarketplaceFilters } from '@/components/marketplace/MarketplaceFilters';
import { ActiveFilters } from '@/components/marketplace/ActiveFilters';
import { ServicesGrid } from '@/components/marketplace/ServicesGrid';
import { useServices, useCategories } from '@/hooks/useServices';
import { useNavigate } from 'react-router-dom';

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  
  const navigate = useNavigate();
  const { data: services = [], isLoading: servicesLoading } = useServices();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

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

  if (servicesLoading || categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <MarketplaceHero servicesCount={services.length} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Available Services
          </h2>
          <p className="text-muted-foreground">
            Discover expert consultants and book services using your points
          </p>
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