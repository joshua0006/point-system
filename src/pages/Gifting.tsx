import React, { useState } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import GiftingMerchants from '@/components/marketplace/GiftingMerchants';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveContainer } from '@/components/ui/mobile-responsive';
import { RedemptionProcess } from '@/components/gifting/RedemptionProcess';
import { useAuth } from '@/contexts/AuthContext';

const Gifting = () => {
  const isMobile = useIsMobile();
  const { profile } = useAuth();

  return (
    <SidebarLayout title="Gifting Merchants" description="Send thoughtful gifts to your clients and partners">
      <ResponsiveContainer>
        <div className={isMobile ? "pt-4 space-y-4" : "pt-8 space-y-6"}>
          <RedemptionProcess giftingBalance={profile?.flexi_credits_balance || 0} />
          <GiftingMerchants />
        </div>
      </ResponsiveContainer>
    </SidebarLayout>
  );
};

export default Gifting;
