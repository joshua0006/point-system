
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface MarketplaceHeroProps {
  servicesCount: number;
}

export function MarketplaceHero({ servicesCount }: MarketplaceHeroProps) {
  const { profile } = useAuth();
  const isConsultant = profile?.role === 'consultant' || profile?.role === 'admin';

  const scrollToServices = () => {
    const servicesSection = document.querySelector('[data-services-section]');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 p-4 rounded-full">
              <Search className="w-12 h-12 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Expert Consultation
            <span className="block text-primary">Marketplace</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with top-tier consultants and book services using your points. 
            Get expert advice tailored to your needs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={scrollToServices}
            >
              <Search className="w-5 h-5 mr-2" />
              Browse Marketplace
            </Button>
            
            {!isConsultant && (
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6"
                asChild
              >
                <Link to="/auth">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Join as Consultant
                </Link>
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">{servicesCount}+</div>
              <p className="text-muted-foreground">Expert Services</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">4.9★</div>
              <p className="text-muted-foreground">Average Rating</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <p className="text-muted-foreground">Support Available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
