
import { Search } from 'lucide-react';

interface MarketplaceHeroProps {
  servicesCount: number;
}

export function MarketplaceHero({ servicesCount }: MarketplaceHeroProps) {
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
          
        </div>
      </div>
    </div>
  );
}
