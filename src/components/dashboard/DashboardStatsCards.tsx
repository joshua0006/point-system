import { memo, useState } from 'react';
import { OptimizedCard, OptimizedCardContent, OptimizedCardHeader } from "@/components/ui/optimized-card";
import { TrendingUp, Wallet, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserStats } from "@/hooks/useDashboard";
import { QuickUnlockModal } from "@/components/wallet/QuickUnlockModal";

interface DashboardStatsCardsProps {
  isMobile: boolean;
  userStats: UserStats;
  onTabChange: (tab: string) => void;
  onLockedCreditsClick?: () => void;
}

export const DashboardStatsCards = memo(({ 
  isMobile, 
  userStats, 
  onTabChange,
  onLockedCreditsClick
}: DashboardStatsCardsProps) => {
  const [showQuickUnlock, setShowQuickUnlock] = useState(false);
  const earliestExpiring = userStats.expiring_awarded_credits?.[0];
  const daysUntilExpiry = earliestExpiring?.days_until_expiry || 0;
  const hasExpiringCredits = daysUntilExpiry > 0 && daysUntilExpiry <= 30;

  return (
    <section
      className={isMobile ? "space-y-4 mb-6" : "grid grid-cols-3 gap-6 mb-8"}
      aria-label="Account statistics"
    >
      <OptimizedCard
        className="border-l-4 border-l-primary"
        role="region"
        aria-label={`Flexi-Credits Balance: ${Math.abs(userStats.totalPoints).toLocaleString()} ${userStats.totalPoints < 0 ? 'flexi-credits owed' : 'available flexi-credits'}`}
      >
        <OptimizedCardHeader className="pb-3">
          <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            Flexi-Credits Balance
            <Wallet className="w-4 h-4 text-primary" aria-hidden="true" />
          </div>
        </OptimizedCardHeader>
        <OptimizedCardContent>
          <div
            className="text-2xl font-bold text-foreground"
            aria-live="polite"
            aria-atomic="true"
          >
            {userStats.totalPoints < 0 ? 'Owes ' : ''}{Math.abs(userStats.totalPoints).toLocaleString()}{userStats.totalPoints < 0 ? ' pts' : ''}
          </div>
          <p className="text-xs text-muted-foreground">
            {userStats.totalPoints < 0 ? 'flexi-credits owed' : 'available flexi-credits'}
          </p>
        </OptimizedCardContent>
      </OptimizedCard>

      {isMobile ? (
        <div className="grid grid-cols-2 gap-4">
          <OptimizedCard
        className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-accent"
        onClick={() => setShowQuickUnlock(true)}
        role="button"
        tabIndex={0}
        aria-label={`Locked Awarded Credits: ${userStats.locked_awarded_balance.toFixed(1)} flexi-credits${earliestExpiring ? `, expires on ${new Date(earliestExpiring.expires_at).toLocaleDateString()}` : ''}. Click to unlock credits.`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowQuickUnlock(true);
          }
        }}
      >
        <OptimizedCardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              Locked Awarded FXC
              {hasExpiringCredits && userStats.locked_awarded_balance > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Expiring Soon
                </Badge>
              )}
            </div>
            <Lock className="w-4 h-4 text-accent" aria-hidden="true" />
          </div>
        </OptimizedCardHeader>
        <OptimizedCardContent>
          <div className="text-2xl font-bold text-foreground" aria-live="polite">
            {userStats.locked_awarded_balance.toFixed(1)}
          </div>
          {earliestExpiring ? (
            <p className="text-xs text-muted-foreground">
              Expires on {new Date(earliestExpiring.expires_at).toLocaleDateString()}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              No active awards
            </p>
          )}
        </OptimizedCardContent>
      </OptimizedCard>

      <OptimizedCard
        className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-muted-foreground/30"
        onClick={() => onTabChange('transactions')}
        role="button"
        tabIndex={0}
        aria-label={`Total Spent: ${userStats.pointsSpent.toLocaleString()} flexi-credits. Click to view transaction history.`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onTabChange('transactions');
          }
        }}
      >
        <OptimizedCardHeader className="pb-3">
          <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            Total Spent
            <TrendingUp className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          </div>
        </OptimizedCardHeader>
        <OptimizedCardContent>
          <div className="text-2xl font-bold text-foreground">{userStats.pointsSpent.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">flexi-credits spent</p>
        </OptimizedCardContent>
      </OptimizedCard>
        </div>
      ) : (
        <>
          <OptimizedCard
            className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-accent"
            onClick={() => setShowQuickUnlock(true)}
            role="button"
            tabIndex={0}
            aria-label={`Locked Awarded Credits: ${userStats.locked_awarded_balance.toFixed(1)} flexi-credits${earliestExpiring ? `, expires on ${new Date(earliestExpiring.expires_at).toLocaleDateString()}` : ''}. Click to unlock credits.`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowQuickUnlock(true);
              }
            }}
          >
            <OptimizedCardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  Locked Awarded FXC
                  {hasExpiringCredits && userStats.locked_awarded_balance > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Expiring Soon
                    </Badge>
                  )}
                </div>
                <Lock className="w-4 h-4 text-accent" aria-hidden="true" />
              </div>
            </OptimizedCardHeader>
            <OptimizedCardContent>
              <div className="text-2xl font-bold text-foreground" aria-live="polite">
                {userStats.locked_awarded_balance.toFixed(1)}
              </div>
              {earliestExpiring ? (
                <p className="text-xs text-muted-foreground">
                  Expires on {new Date(earliestExpiring.expires_at).toLocaleDateString()}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No active awards
                </p>
              )}
            </OptimizedCardContent>
          </OptimizedCard>

          <OptimizedCard
            className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-muted-foreground/30"
            onClick={() => onTabChange('transactions')}
            role="button"
            tabIndex={0}
            aria-label={`Total Spent: ${userStats.pointsSpent.toLocaleString()} flexi-credits. Click to view transaction history.`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onTabChange('transactions');
              }
            }}
          >
            <OptimizedCardHeader className="pb-3">
              <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                Total Spent
                <TrendingUp className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              </div>
            </OptimizedCardHeader>
            <OptimizedCardContent>
              <div className="text-2xl font-bold text-foreground">{userStats.pointsSpent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">flexi-credits spent</p>
            </OptimizedCardContent>
          </OptimizedCard>
        </>
      )}

      <QuickUnlockModal
        open={showQuickUnlock}
        onOpenChange={setShowQuickUnlock}
        lockedBalance={userStats.locked_awarded_balance}
        currentBalance={userStats.totalPoints}
      />
    </section>
  );
});