import React from 'react';
import { Navigation } from '@/components/Navigation';
import LeadGenCampaigns from './LeadGenCampaigns';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveContainer } from '@/components/ui/mobile-responsive';

const Campaigns = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <ResponsiveContainer>
        <div className={isMobile ? "pt-4" : "pt-8"}>
          <div className={isMobile ? "mb-4" : "mb-6 sm:mb-8"}>
            <h1 className={isMobile ? "text-xl font-bold text-foreground mb-2" : "text-2xl sm:text-3xl font-bold text-foreground mb-2"}>
              Lead Generation Campaigns
            </h1>
            <p className={isMobile ? "text-sm text-muted-foreground" : "text-muted-foreground text-sm sm:text-base"}>
              Launch targeted campaigns to reach your ideal audience
            </p>
          </div>
          
          <LeadGenCampaigns />
        </div>
      </ResponsiveContainer>
    </div>
  );
};

export default Campaigns;