import React, { useState, useRef, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useFocusRing, mergeProps, VisuallyHidden } from 'react-aria';

interface Merchant {
  id: string;
  name: string;
  description: string;
  website: string;
  category: string;
  logoPath: string;
  expandedContent?: string;
}

const merchants: Merchant[] = [
  {
    id: '1',
    name: 'Smilie.io',
    description: 'Personalized gifts and memorable experiences that bring smiles to your loved ones',
    website: 'https://smilie.io/',
    category: 'Personalized Gifts',
    logoPath: '/smilie.png',
    expandedContent: `Perfect for corporate gifting with low minimum order quantities across various occasions. Whether it's celebrating a milestone, saying thank you, or marking a special event, thoughtful gifts strengthen client relationships. Even transport fare can be included in gift options, making it versatile for any appreciation moment.`
  },
  {
    id: '2',
    name: 'Sogurt',
    description: 'Premium frozen yogurt treats with fresh toppings and natural flavors',
    website: 'https://www.sogurt.com.sg/',
    category: 'Food & Treats',
    logoPath: '/Sogurt_Logo_White_Pink_1_150x.png',
    expandedContent: `A thoughtful way to cheer up clients during recovery or tough times. Healthy treats show you care about their wellbeing. Small gestures like these create memorable touchpoints that go beyond business — they build lasting relationships that clients remember.`
  },
  {
    id: '3',
    name: 'TableTopics.sg',
    description: 'Conversation starter games and thoughtful gifts for meaningful connections',
    website: 'https://www.tabletopics.sg/',
    category: 'Games & Activities',
    logoPath: '/Tabletopics.avif',
    expandedContent: `Personalized gifts that last forever and stay visible in your client's daily life. Unlike consumables, these are items clients use and see every day — constant reminders of your relationship. The best gifts aren't expensive; they're meaningful and enduring.`
  },
  {
    id: '4',
    name: 'Grab Gifts',
    description: 'Reimburse your transport fare with convenient ride vouchers and gift cards',
    website: 'https://gifts.grab.com/sg/',
    category: 'Transport & Rides',
    logoPath: '/gifts-brand-w.svg',
    expandedContent: `Your time is worth $50–100 an hour. If you save even one hour of commuting, that's not just money saved — it's energy protected and progress accelerated. Use flexi credits to claim Grab rides and maximize your time for more appointments and impact. Flexi credits are earned through positive behaviours like good attendance, helping teammates, and coaching juniors — it's our way of rewarding the right actions and building shared ownership.`
  }
];

// Accessible Merchant Card Component
interface MerchantCardProps {
  merchant: Merchant;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onVisit: (website: string) => void;
}

const MerchantCard: React.FC<MerchantCardProps> = ({ merchant, index, isExpanded, onToggle, onVisit }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { focusProps, isFocusVisible } = useFocusRing();

  const handleKeyDown = (e: ReactKeyboardEvent) => {
    // Allow Enter or Space to activate the card
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
    // Quick access with number keys (1-4)
    if (e.key === (index + 1).toString()) {
      onVisit(merchant.website);
    }
  };

  return (
    <article
      ref={cardRef}
      role="listitem"
      aria-labelledby={`merchant-${merchant.id}-title`}
      aria-describedby={`merchant-${merchant.id}-description`}
      className="h-full focus:outline-none"
    >
      <Card
        {...mergeProps(focusProps)}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={`
          h-full flex flex-col
          hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group
          ${isFocusVisible ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
        `}
      >
        {/* Logo Section with Gradient Background */}
        <div className="relative bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 p-2.5 xs:p-3 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[120px] sm:min-h-[140px] md:min-h-[160px]">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 flex items-center justify-center">
            <img
              src={merchant.logoPath}
              alt={`${merchant.name} company logo`}
              className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
            />
          </div>
          {/* Category Badge - Positioned in corner */}
          <span
            className="absolute top-2 right-2 sm:top-3 sm:right-3 text-[10px] sm:text-xs px-2 py-0.5 sm:px-3 sm:py-1 bg-white/90 text-foreground rounded-full shadow-sm font-medium"
            aria-label={`Category: ${merchant.category}`}
          >
            {merchant.category}
          </span>
        </div>

        <CardHeader className="pb-2 sm:pb-3 px-2 xs:px-2.5 sm:px-3 md:px-6 pt-3 sm:pt-6">
          <CardTitle
            id={`merchant-${merchant.id}-title`}
            className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-center mb-1.5 sm:mb-2"
          >
            {merchant.name}
          </CardTitle>
          <CardDescription
            id={`merchant-${merchant.id}-description`}
            className="text-xs sm:text-sm text-center leading-relaxed"
          >
            {merchant.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col flex-1 pt-0 px-2 xs:px-2.5 sm:px-3 md:px-6 pb-2.5 sm:pb-3 md:pb-6">
          {/* Collapsible Content Section */}
          <div className="flex-grow space-y-2 sm:space-y-3 mb-2 sm:mb-3">
            {merchant.expandedContent && (
              <Collapsible
                open={isExpanded}
                onOpenChange={onToggle}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-xs sm:text-sm hover:bg-primary/5 h-9 sm:h-10"
                    aria-expanded={isExpanded}
                    aria-controls={`merchant-${merchant.id}-details`}
                    aria-label={`${isExpanded ? 'Hide' : 'Show'} why to use ${merchant.name}`}
                  >
                    <span>Why use this?</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent
                  className="pt-1.5 sm:pt-2"
                  id={`merchant-${merchant.id}-details`}
                  role="region"
                  aria-live="polite"
                >
                  <div className="rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground leading-relaxed border border-border/50">
                    {merchant.expandedContent}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>

          {/* Button Fixed at Bottom - Enhanced Touch Target */}
          <Button
            onClick={() => onVisit(merchant.website)}
            className="w-full font-medium shadow-sm hover:shadow-md transition-shadow mt-auto text-xs sm:text-sm h-10 sm:h-10 md:h-11 px-2 xs:px-3 sm:px-4"
            variant="default"
            aria-label={`Visit ${merchant.name} store (opens in new tab)`}
          >
            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" aria-hidden="true" />
            <span className="whitespace-nowrap">Visit Store</span>
            <VisuallyHidden>(opens in new window)</VisuallyHidden>
          </Button>
        </CardContent>
      </Card>
    </article>
  );
};

const GiftingMerchants = () => {
  const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({});

  const visitMerchant = (website: string) => {
    window.open(website, '_blank', 'noopener,noreferrer');
  };

  const toggleExpanded = (merchantId: string) => {
    setExpandedCards(prev => ({ ...prev, [merchantId]: !prev[merchantId] }));
  };

  return (
    <section
      aria-labelledby="gifting-partners-heading"
      className="space-y-8"
    >
      {/* Header Section with Semantic Structure */}
      <header className="text-center mb-6 sm:mb-8 md:mb-10 px-2 sm:px-4">
        <h2
          id="gifting-partners-heading"
          className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 text-blue-600"
        >
          Gifting Partners
        </h2>
        <p className="text-muted-foreground text-xs sm:text-sm md:text-base max-w-full sm:max-w-2xl mx-auto px-2">
          Special discounts from our trusted merchant partners for meaningful gifts that strengthen relationships
        </p>

        {/* Keyboard Navigation Instructions (Screen Reader Only) */}
        <VisuallyHidden>
          <p>Use Tab to navigate between merchant cards. Press Enter or Space to expand card details. Press numbers 1-4 to quickly visit respective merchant stores.</p>
        </VisuallyHidden>
      </header>

      {/* Merchant Cards List with Semantic Structure */}
      <nav
        aria-label="Merchant partner cards"
        role="list"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 xs:gap-2.5 sm:gap-3 md:gap-4 lg:gap-6"
      >
        {merchants.map((merchant, index) => (
          <MerchantCard
            key={merchant.id}
            merchant={merchant}
            index={index}
            isExpanded={expandedCards[merchant.id] || false}
            onToggle={() => toggleExpanded(merchant.id)}
            onVisit={visitMerchant}
          />
        ))}
      </nav>

      {/* Footer Information */}
      <footer
        className="text-center mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8 border-t border-border/50 px-2 sm:px-4"
        role="contentinfo"
        aria-label="Partner program information"
      >
        <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">
          These are our trusted partners for meaningful gifts to your clients and loved ones.
        </p>
        <p className="text-[10px] sm:text-xs text-muted-foreground/70">
          Purchase from partner merchants and get reimbursed with flexi-credits
        </p>
      </footer>
    </section>
  );
};

export default GiftingMerchants;