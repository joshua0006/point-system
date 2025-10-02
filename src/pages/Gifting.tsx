import React, { useState } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import GiftingMerchants from '@/components/marketplace/GiftingMerchants';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveContainer } from '@/components/ui/mobile-responsive';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRightLeft, Gift } from 'lucide-react';
import { ConvertCreditsModal } from '@/components/gifting/ConvertCreditsModal';
import { ConversionSuccessModal } from '@/components/gifting/ConversionSuccessModal';
import { useAuth } from '@/contexts/AuthContext';

const Gifting = () => {
  const isMobile = useIsMobile();
  const { profile, refreshProfile } = useAuth();
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [conversionData, setConversionData] = useState<any>(null);

  const handleConversionSuccess = async (data: any) => {
    setConversionData(data);
    setShowSuccessModal(true);
    await refreshProfile();
  };

  return (
    <SidebarLayout title="Gifting Merchants" description="Send thoughtful gifts to your clients and partners">
      <ResponsiveContainer>
        <div className={isMobile ? "pt-4 space-y-4" : "pt-8 space-y-6"}>
          {/* Gifting Credits Conversion Section */}
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Gifting Credits</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Convert your Flexi Credits to Gifting Credits to purchase gifts for your clients from our partner merchants.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Available Balance</p>
                    <p className="text-2xl font-bold text-primary">
                      {(profile?.gifting_credits_balance || 0).toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">Gifting Credits</p>
                  </div>
                  <div className="h-12 w-px bg-border" />
                  <div>
                    <p className="text-xs text-muted-foreground">Flexi Credits</p>
                    <p className="text-xl font-semibold">
                      {(profile?.flexi_credits_balance || 0).toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setShowConvertModal(true)}
                size={isMobile ? "sm" : "default"}
                className="whitespace-nowrap"
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Convert Credits
              </Button>
            </div>
          </Card>

          <GiftingMerchants />
        </div>
      </ResponsiveContainer>

      <ConvertCreditsModal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        onSuccess={handleConversionSuccess}
      />

      <ConversionSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        conversionData={conversionData}
      />
    </SidebarLayout>
  );
};

export default Gifting;