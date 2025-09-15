import React from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import GiftingMerchants from '@/components/marketplace/GiftingMerchants';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveContainer } from '@/components/ui/mobile-responsive';

const Gifting = () => {
  const isMobile = useIsMobile();

  return (
    <SidebarLayout title="Gifting Merchants" description="Send thoughtful gifts to your clients and partners">
      <ResponsiveContainer>
        <div className={isMobile ? "pt-4" : "pt-8"}>
          <GiftingMerchants />
        </div>
      </ResponsiveContainer>
    </SidebarLayout>
  );
};

export default Gifting;