import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { ServiceCard, Service } from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Users, Star, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-consulting.jpg";

// Mock data
const mockServices: Service[] = [
  {
    id: "1",
    title: "Strategic Business Consultation",
    description: "1-hour strategic planning session to align your business goals with actionable roadmaps and KPIs.",
    category: "Strategy",
    points: 500,
    duration: "1 hour",
    consultant: {
      name: "Sarah Chen",
      tier: "platinum",
    },
    bookingUrl: "https://calendly.com/sarah-chen/strategy",
    tags: ["Planning", "KPIs", "Growth"],
  },
  {
    id: "2", 
    title: "Technical Architecture Review",
    description: "Comprehensive review of your system architecture with optimization recommendations.",
    category: "Technology",
    points: 350,
    duration: "45 mins",
    consultant: {
      name: "Marcus Rodriguez",
      tier: "gold",
    },
    bookingUrl: "https://calendly.com/marcus-rodriguez/tech-review",
    tags: ["Architecture", "Optimization", "Scalability"],
  },
  {
    id: "3",
    title: "Marketing Campaign Analysis",
    description: "Deep dive analysis of your current marketing efforts with actionable improvement strategies.",
    category: "Marketing",
    points: 275,
    duration: "30 mins",
    consultant: {
      name: "Emily Johnson",
      tier: "silver",
    },
    bookingUrl: "https://calendly.com/emily-johnson/marketing",
    tags: ["Analysis", "Campaigns", "ROI"],
  },
  {
    id: "4",
    title: "Financial Planning & Budgeting",
    description: "Personal financial planning session covering budgeting, investments, and long-term financial goals.",
    category: "Finance",
    points: 400,
    duration: "1 hour",
    consultant: {
      name: "David Kim",
      tier: "gold",
    },
    bookingUrl: "https://calendly.com/david-kim/finance",
    tags: ["Budgeting", "Investments", "Planning"],
  },
  {
    id: "5",
    title: "Career Development Coaching",
    description: "Professional coaching to help advance your career with personalized strategies and action plans.",
    category: "Career",
    points: 200,
    duration: "45 mins",
    consultant: {
      name: "Lisa Thompson",
      tier: "bronze",
    },
    bookingUrl: "https://calendly.com/lisa-thompson/career",
    tags: ["Coaching", "Development", "Strategy"],
  },
];

const categories = ["All", "Strategy", "Technology", "Marketing", "Finance", "Career"];
const tiers = ["All", "Bronze", "Silver", "Gold", "Platinum"];

export default function Marketplace() {
  const [services, setServices] = useState(mockServices);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTier, setSelectedTier] = useState("All");
  const { toast } = useToast();

  const filteredServices = services.filter((service) => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || service.category === selectedCategory;
    const matchesTier = selectedTier === "All" || 
                       service.consultant.tier.toLowerCase() === selectedTier.toLowerCase();
    
    return matchesSearch && matchesCategory && matchesTier;
  });

  const handlePurchase = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      toast({
        title: "Service Purchased!",
        description: `You've successfully purchased "${service.title}" for ${service.points} points.`,
      });
    }
  };

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
                  <div className="text-2xl font-bold text-foreground">89</div>
                  <div className="text-sm text-muted-foreground">Expert Consultants</div>
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
            
            <div className="flex gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  {tiers.map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {tier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          <div className="flex gap-2 mt-4">
            {selectedCategory !== "All" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Category: {selectedCategory}
                <button 
                  onClick={() => setSelectedCategory("All")}
                  className="ml-1 hover:bg-background/20 rounded-full p-0.5"
                >
                  ×
                </button>
              </Badge>
            )}
            {selectedTier !== "All" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Tier: {selectedTier}
                <button 
                  onClick={() => setSelectedTier("All")}
                  className="ml-1 hover:bg-background/20 rounded-full p-0.5"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-muted-foreground">
            {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onPurchase={handlePurchase}
            />
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No services found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}