import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface Merchant {
  id: string;
  name: string;
  description: string;
  website: string;
  category: string;
  expandedContent?: string;
}

const merchants: Merchant[] = [
  {
    id: '1',
    name: 'Smilie.io',
    description: 'Personalized gifts and memorable experiences that bring smiles to your loved ones',
    website: 'https://smilie.io/',
    category: 'Personalized Gifts',
    expandedContent: `Perfect for corporate gifting with low minimum order quantities across various occasions. Whether it's celebrating a milestone, saying thank you, or marking a special event, thoughtful gifts strengthen client relationships. Even transport fare can be included in gift options, making it versatile for any appreciation moment.`
  },
  {
    id: '2', 
    name: 'Sogurt',
    description: 'Premium frozen yogurt treats with fresh toppings and natural flavors',
    website: 'https://www.sogurt.com.sg/',
    category: 'Food & Treats',
    expandedContent: `A thoughtful way to cheer up clients during recovery or tough times. Healthy treats show you care about their wellbeing. Small gestures like these create memorable touchpoints that go beyond business — they build lasting relationships that clients remember.`
  },
  {
    id: '3',
    name: 'TableTopics.sg',
    description: 'Conversation starter games and thoughtful gifts for meaningful connections',
    website: 'https://www.tabletopics.sg/',
    category: 'Games & Activities',
    expandedContent: `Personalized gifts that last forever and stay visible in your client's daily life. Unlike consumables, these are items clients use and see every day — constant reminders of your relationship. The best gifts aren't expensive; they're meaningful and enduring.`
  },
  {
    id: '4',
    name: 'Grab Gifts',
    description: 'Reimburse your transport fare with convenient ride vouchers and gift cards',
    website: 'https://gifts.grab.com/sg/',
    category: 'Transport & Rides',
    expandedContent: `Your time is worth $50–100 an hour. If you save even one hour of commuting, that's not just money saved — it's energy protected and progress accelerated. Use flexi credits to claim Grab rides and maximize your time for more appointments and impact. Flexi credits are earned through positive behaviours like good attendance, helping teammates, and coaching juniors — it's our way of rewarding the right actions and building shared ownership.`
  }
];

const GiftingMerchants = () => {
  const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({});

  const visitMerchant = (website: string) => {
    window.open(website, '_blank', 'noopener,noreferrer');
  };

  const toggleExpanded = (merchantId: string) => {
    setExpandedCards(prev => ({ ...prev, [merchantId]: !prev[merchantId] }));
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
            
            <CardContent className="space-y-3">
              {merchant.expandedContent && (
                <Collapsible 
                  open={expandedCards[merchant.id]} 
                  onOpenChange={() => toggleExpanded(merchant.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between text-sm"
                    >
                      <span>Why use this?</span>
                      {expandedCards[merchant.id] ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="rounded-md bg-muted/50 p-4 text-sm text-muted-foreground leading-relaxed">
                      {merchant.expandedContent}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
              
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