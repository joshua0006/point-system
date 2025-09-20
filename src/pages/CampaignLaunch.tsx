import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveContainer } from '@/components/ui/mobile-responsive';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TopUpModal } from '@/components/TopUpModal';
import { useToast } from '@/hooks/use-toast';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { CampaignMethodSelector } from '@/components/campaigns/CampaignMethodSelector';
import { useState } from 'react';

const CampaignLaunch = React.memo(() => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);

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
        <div className={isMobile ? "pt-4" : "pt-8"}>
          <div className={isMobile ? "mb-4" : "mb-6 sm:mb-8"}>
            <div className="flex items-center gap-2 mb-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/campaigns/my-campaigns')}
                className="flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to My Campaigns
              </Button>
            </div>
          </div>

          {/* Wallet Balance Card */}
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Wallet Balance</span>
                  <Button 
                    onClick={() => setTopUpModalOpen(true)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Top Up Wallet
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {profile?.flexi_credits_balance || 0} points
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Available for campaign launches and services
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Method Selection */}
          <div className="max-w-4xl mx-auto">
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