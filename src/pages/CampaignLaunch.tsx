import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveContainer } from '@/components/ui/mobile-responsive';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { TopUpModal } from '@/components/TopUpModal';
import { useToast } from '@/hooks/use-toast';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { CampaignMethodSelector } from '@/components/campaigns/CampaignMethodSelector';

const CampaignLaunch = React.memo(() => {
  const isMobile = useIsMobile();
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleTopUpSuccess = (points: number) => {
    refreshProfile();
    toast({
      title: "Top-up Successful! 🎉",
      description: `${points} points added to your account.`
    });
  };

  return (
    <SidebarLayout title="Launch New Campaign" description="Select a campaign type to get started">
      <ResponsiveContainer>
        <div className={isMobile ? "pt-2" : "pt-4"}>
          {/* Hero Section - Accessibility Enhanced */}
          <header
            className={`${isMobile ? "mb-8" : "mb-12"} text-center`}
            role="banner"
            aria-labelledby="campaign-launch-heading"
          >
            <Badge
              variant="secondary"
              className="inline-flex items-center gap-2 mb-3 px-4 py-2"
            >
              <Zap className="h-4 w-4" aria-hidden="true" />
              <span>Campaign Launch Center</span>
            </Badge>
            <h1
              id="campaign-launch-heading"
              className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold mb-3 text-primary`}
            >
              Launch Your Next Campaign
            </h1>
            <p className={`${isMobile ? "text-sm" : "text-base"} text-muted-foreground max-w-2xl mx-auto`}>
              Choose from our proven campaign strategies to generate quality leads and grow your business
            </p>
          </header>

          {/* Campaign Method Selection */}
          <div className="max-w-7xl mx-auto">
            <CampaignMethodSelector />
          </div>
        </div>
      </ResponsiveContainer>

      {/* Top Up Modal */}
      <TopUpModal
        isOpen={topUpModalOpen}
        onClose={() => setTopUpModalOpen(false)}
        onSuccess={handleTopUpSuccess}
      />
    </SidebarLayout>
  );
});

CampaignLaunch.displayName = 'CampaignLaunch';

export default CampaignLaunch;