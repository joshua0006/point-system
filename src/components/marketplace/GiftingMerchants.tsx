import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface Merchant {
  id: string;
  name: string;
  description: string;
  website: string;
  category: string;
}

const merchants: Merchant[] = [
  {
    id: '1',
    name: 'Smilie.io',
    description: 'Personalized gifts and memorable experiences that bring smiles to your loved ones',
    website: 'https://smilie.io/',
    category: 'Personalized Gifts'
  },
  {
    id: '2', 
    name: 'Sogurt',
    description: 'Premium frozen yogurt treats with fresh toppings and natural flavors',
    website: 'https://www.sogurt.com.sg/',
    category: 'Food & Treats'
  },
  {
    id: '3',
    name: 'TableTopics.sg',
    description: 'Conversation starter games and thoughtful gifts for meaningful connections',
    website: 'https://www.tabletopics.sg/',
    category: 'Games & Activities'
  },
  {
    id: '4',
    name: 'Grab Gifts',
    description: 'Reimburse your transport fare with convenient ride vouchers and gift cards',
    website: 'https://gifts.grab.com/sg/',
    category: 'Transport & Rides'
  }
];

const GiftingMerchants = () => {
  const visitMerchant = (website: string) => {
    window.open(website, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Gifting Partners
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          Special discounts from our trusted merchant partners for meaningful gifts
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {merchants.map((merchant) => (
          <Card key={merchant.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{merchant.name}</CardTitle>
                <span className="text-xs px-2 py-1 bg-accent text-accent-foreground rounded-full">
                  {merchant.category}
                </span>
              </div>
              <CardDescription className="text-sm">
                {merchant.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Button
                onClick={() => visitMerchant(merchant.website)}
                className="w-full"
                variant="outline"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Store
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground mt-8">
        <p>
          These are our trusted partners for meaningful gifts to your clients and loved ones.
        </p>
      </div>
    </div>
  );
};

export default GiftingMerchants;