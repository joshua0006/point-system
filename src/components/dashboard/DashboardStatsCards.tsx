import { memo } from 'react';
import { OptimizedCard, OptimizedCardContent, OptimizedCardHeader } from "@/components/ui/optimized-card";
import { WalletDrawer } from "@/components/wallet/WalletDrawer";
import { TrendingUp, Wallet } from "lucide-react";
import { UserStats } from "@/hooks/useDashboard";
import { ModalType } from "@/hooks/useDashboardModals";

interface DashboardStatsCardsProps {
  isMobile: boolean;
  userStats: UserStats;
  openModal: (type: ModalType) => void;
}

export const DashboardStatsCards = memo(({ 
  isMobile, 
  userStats, 
  openModal 
}: DashboardStatsCardsProps) => (
  <div className={isMobile ? "grid grid-cols-1 gap-4 mb-6" : "grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"}>
    <WalletDrawer>
      <OptimizedCard className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground cursor-pointer hover:shadow-lg transition-shadow">
        <OptimizedCardHeader className="pb-3">
          <div className="flex items-center justify-between text-sm font-medium">
            Flexi-Credits Balance
            <Wallet className="w-4 h-4" />
          </div>
        </OptimizedCardHeader>
        <OptimizedCardContent>
          <div className={`text-2xl font-bold ${userStats.totalPoints < 0 ? 'text-red-200' : ''}`}>
            {userStats.totalPoints < 0 ? 'Owes ' : ''}{Math.abs(userStats.totalPoints).toLocaleString()}{userStats.totalPoints < 0 ? ' pts' : ''}
          </div>
          <p className="text-xs opacity-90">
            {userStats.totalPoints < 0 ? 'flexi-credits owed' : 'available flexi-credits'}
          </p>
        </OptimizedCardContent>
      </OptimizedCard>
    </WalletDrawer>

    <OptimizedCard 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => openModal('spent')}
    >
      <OptimizedCardHeader className="pb-3">
        <div className="flex items-center justify-between text-sm font-medium">
          Total Spent
          <TrendingUp className="w-4 h-4 text-destructive" />
        </div>
      </OptimizedCardHeader>
      <OptimizedCardContent>
        <div className="text-2xl font-bold text-foreground">{userStats.pointsSpent.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">flexi-credits spent</p>
      </OptimizedCardContent>
    </OptimizedCard>
  </div>
));