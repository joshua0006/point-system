
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
          
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-foreground mb-4 sm:mb-6">
            Support Services for Consultants
            <span className="block text-primary">Marketplace</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
            Essential infrastructure services for financial consultants. 
            Purchase professional support services to enhance your practice.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12">
            <Button 
              size="lg" 
              className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-12 sm:h-auto"
              onClick={scrollToServices}
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Browse Marketplace
            </Button>
            
            {!isConsultant && (
              <Button 
                variant="outline" 
                size="lg" 
                className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-12 sm:h-auto"
                asChild
              >
                <Link to="/auth">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Join as Consultant
                </Link>
              </Button>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
