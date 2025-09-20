import { memo } from 'react';

interface DashboardHeaderProps {
  isMobile: boolean;
}

export const DashboardHeader = memo(({ isMobile }: DashboardHeaderProps) => (
  <div className={isMobile ? "mb-6" : "mb-8"}>
    <h1 className={isMobile ? "text-2xl font-bold text-foreground mb-2" : "text-3xl font-bold text-foreground mb-2"}>
      My Dashboard
    </h1>
    <p className={isMobile ? "text-sm text-muted-foreground" : "text-muted-foreground"}>
      Track your flexi-credits, bookings, and consultation history
    </p>
  </div>
));