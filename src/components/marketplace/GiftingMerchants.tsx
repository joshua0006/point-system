import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Merchant {
  id: string;
  name: string;
  description: string;
  website: string;
  promoCode: string;
  category: string;
}

const merchants: Merchant[] = [
  {
    id: '1',
    name: 'Smilie.io',
    description: 'Personalized gifts and memorable experiences that bring smiles to your loved ones',
    website: 'https://smilie.io/',
    promoCode: 'CONSULTING10',
    category: 'Personalized Gifts'
  },
  {
    id: '2', 
    name: 'Sogurt',
    description: 'Premium frozen yogurt treats with fresh toppings and natural flavors',
    website: 'https://www.sogurt.com.sg/',
    promoCode: 'SWEET15',
    category: 'Food & Treats'
  },
  {
    id: '3',
    name: 'TableTopics.sg',
    description: 'Conversation starter games and thoughtful gifts for meaningful connections',
    website: 'https://www.tabletopics.sg/',
    promoCode: 'CONNECT20',
    category: 'Games & Activities'
  }
];

const GiftingMerchants = () => {
  const { toast } = useToast();

  const copyPromoCode = (code: string, merchantName: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Promo code copied!",
      description: `${code} for ${merchantName} has been copied to your clipboard.`,
    });
  };

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
            
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Promo Code</p>
                    <p className="font-mono font-semibold text-sm">{merchant.promoCode}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyPromoCode(merchant.promoCode, merchant.name)}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

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
          These are our trusted partners offering exclusive discounts to our community.
          Promo codes are subject to merchant terms and conditions.
        </p>
      </div>
    </div>
  );
};

export default GiftingMerchants;