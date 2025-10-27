import React, { useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import GiftingMerchants from '@/components/marketplace/GiftingMerchants';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveContainer } from '@/components/ui/mobile-responsive';
import { RedemptionProcess } from '@/components/gifting/RedemptionProcess';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Gift } from '@/lib/icons';

const Gifting = () => {
  const isMobile = useIsMobile();
  const { profile } = useAuth();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <SidebarLayout title="Gifting Merchants" description="Send thoughtful gifts to your clients and partners">
      <ResponsiveContainer>
        <div className={isMobile ? "pt-2" : "pt-4"}>
          {/* Hero Section - Accessibility Enhanced */}
          <header
            className={`${isMobile ? "mb-6" : "mb-8 md:mb-12"} text-center px-2 sm:px-4`}
            role="banner"
            aria-labelledby="gifting-heading"
          >
            <Badge
              variant="secondary"
              className="inline-flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm"
            >
              <Gift className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
              <span>Client Gifting Platform</span>
            </Badge>
            <h1
              id="gifting-heading"
              className={`${isMobile ? "text-xl" : "text-2xl md:text-3xl"} font-bold mb-2 sm:mb-3 text-blue-600 px-2`}
            >
              Strengthen Client Relationships with Gifts
            </h1>
            <p className={`${isMobile ? "text-xs" : "text-sm md:text-base"} text-muted-foreground max-w-full sm:max-w-2xl mx-auto px-2`}>
              Purchase from our partner merchants and get reimbursed with flexi-credits. Show appreciation to your clients with thoughtful gifts.
            </p>
          </header>

          {/* Skip to content link for screen readers */}
          <a
            href="#redemption-process"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md"
          >
            Skip to redemption process
          </a>

          {/* Main Content */}
          <div
            className={isMobile ? "space-y-3 mb-4" : "space-y-4 sm:space-y-6 mb-6 sm:mb-8"}
            role="main"
          >
            <div id="redemption-process">
              <RedemptionProcess giftingBalance={profile?.flexi_credits_balance || 0} />
            </div>
            <GiftingMerchants />
          </div>
        </div>
      </ResponsiveContainer>
    </SidebarLayout>
  );
};

export default Gifting;
