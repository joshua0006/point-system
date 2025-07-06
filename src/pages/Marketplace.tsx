import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { ServiceCard } from '@/components/ServiceCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, Star, Users, Clock } from 'lucide-react';
import { useServices, useCategories } from '@/hooks/useServices';
import { useBookService } from '@/hooks/useBookings';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import heroImage from "@/assets/hero-consulting.jpg";

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: services = [], isLoading: servicesLoading } = useServices();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const bookServiceMutation = useBookService();

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
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/5 to-accent/5 border-b">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Expert Consultants 
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> 
                  {" "}at Your Service
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Connect with top-tier consultants across strategy, technology, marketing, and finance. 
                Pay with points, book instantly, and get expert guidance tailored to your needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button size="lg" className="px-8">
                  Browse Services
                </Button>
                <Button size="lg" variant="outline" className="px-8">
                  Become a Consultant
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mx-auto mb-2">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{services.length}</div>
                  <div className="text-sm text-muted-foreground">Services Available</div>
                </div>
                <div>
                  <div className="flex items-center justify-center w-12 h-12 bg-accent/10 rounded-lg mx-auto mb-2">
                    <Star className="w-6 h-6 text-accent" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">4.8</div>
                  <div className="text-sm text-muted-foreground">Average Rating</div>
                </div>
                <div>
                  <div className="flex items-center justify-center w-12 h-12 bg-success/10 rounded-lg mx-auto mb-2">
                    <Clock className="w-6 h-6 text-success" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">24h</div>
                  <div className="text-sm text-muted-foreground">Response Time</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-2xl"></div>
              <img 
                src={heroImage} 
                alt="Professional consultants collaborating"
                className="relative rounded-2xl shadow-2xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Available Services
          </h2>
          <p className="text-muted-foreground">
            Discover expert consultants and book services using your points
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search services, consultants, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Tiers</SelectItem>
                <SelectItem value="bronze">Bronze</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {(selectedCategory !== "All" || selectedTier !== "All" || searchTerm) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {searchTerm && (
              <Badge variant="secondary" className="px-3 py-1">
                Search: "{searchTerm}"
                <button 
                  onClick={() => setSearchTerm('')}
                  className="ml-2 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {selectedCategory !== "All" && (
              <Badge variant="secondary" className="px-3 py-1">
                Category: {selectedCategory}
                <button 
                  onClick={() => setSelectedCategory("All")}
                  className="ml-2 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {selectedTier !== "All" && (
              <Badge variant="secondary" className="px-3 py-1">
                Tier: {selectedTier}
                <button 
                  onClick={() => setSelectedTier("All")}
                  className="ml-2 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <Card className="p-8 text-center">
            <CardContent>
              <div className="text-muted-foreground mb-4">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No services found</h3>
                <p>Try adjusting your search criteria or filters</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                  setSelectedTier('All');
                }}
              >
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
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
                tags={[]} // We could add tags to the database schema later
                onClick={handleServiceClick}
              />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {filteredServices.length > 0 && (
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Showing {filteredServices.length} of {services.length} services
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;