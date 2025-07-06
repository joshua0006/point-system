import { Button } from '@/components/ui/button';
import { Users, Star, Clock } from 'lucide-react';
import heroImage from "@/assets/hero-consulting.jpg";

interface MarketplaceHeroProps {
  servicesCount: number;
}

export function MarketplaceHero({ servicesCount }: MarketplaceHeroProps) {
  return (
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
                <div className="text-2xl font-bold text-foreground">{servicesCount}</div>
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
  );
}