import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PrefetchLink } from "@/components/navigation";
import { TrendingUp, Target, Plus, Wallet } from '@/lib/icons';
import { Transaction } from "@/hooks/useDashboard";
import { ModalType } from "@/hooks/useDashboardModals";

interface DashboardContentProps {
  isMobile: boolean;
  recentTransactions: Transaction[];
  campaigns: any[];
  campaignsLoading: boolean;
  openModal: (type: ModalType) => void;
}

export const DashboardContent = memo(({
  isMobile,
  recentTransactions,
  campaigns,
  campaignsLoading,
  openModal
}: DashboardContentProps) => (
  <div className={isMobile ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 lg:grid-cols-2 gap-8"}>
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
      onClick={() => openModal('recentTransactions')}
      role="button"
      tabIndex={0}
      aria-label="Recent Transactions. Click to view all transactions."
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal('recentTransactions');
        }
      }}
    >
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <CardTitle className="flex items-center justify-between gap-2 min-w-0" id="recent-transactions-title">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
            <div className="p-1 sm:p-1.5 md:p-2 bg-primary/10 rounded-lg flex-shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" aria-hidden="true" />
            </div>
            <span className="text-base sm:text-lg font-semibold truncate block min-w-0">Recent Transactions</span>
          </div>
          <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">
            {recentTransactions.length} Recent
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent aria-labelledby="recent-transactions-title" className="px-2.5 sm:px-3 md:px-6 py-3 sm:py-4 overflow-hidden">
        <ul className="space-y-2 sm:space-y-3 list-none overflow-hidden" role="list" aria-label="Recent transaction items">
          {recentTransactions.map((transaction) => (
            <li
              key={transaction.id}
              className={`relative flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg transition-all duration-200 hover:shadow-md border-l-4 overflow-hidden ${
                transaction.subType === 'earned'
                  ? 'bg-green-50/50 hover:bg-green-50 border-green-500 dark:bg-green-950/20 dark:hover:bg-green-950/30'
                  : 'bg-red-50/50 hover:bg-red-50 border-red-500 dark:bg-red-950/20 dark:hover:bg-red-950/30'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div
                  className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0 ${
                    transaction.subType === 'earned'
                      ? 'bg-green-100 dark:bg-green-900/40'
                      : 'bg-red-100 dark:bg-red-900/40'
                  }`}
                  aria-hidden="true"
                >
                  <span className="text-xs sm:text-sm">{transaction.icon}</span>
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="font-medium text-xs sm:text-sm truncate">{transaction.service}</p>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      <time dateTime={transaction.date}>{transaction.date}</time>
                    </p>
                    <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0 max-w-[100px] truncate">
                      {transaction.category}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 justify-between sm:justify-end flex-shrink-0">
                <div
                  className={`font-bold text-xs sm:text-sm rounded-full px-2 sm:px-2.5 py-1 sm:py-1.5 flex items-center gap-0.5 sm:gap-1 whitespace-nowrap ${
                    transaction.subType === 'earned'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                  }`}
                  aria-label={`${transaction.subType === 'earned' ? 'Earned' : 'Spent'} ${transaction.points} credits`}
                >
                  <span className="text-[10px] sm:text-xs">{transaction.subType === 'earned' ? '↑' : '↓'}</span>
                  <span className="text-xs sm:text-sm">{transaction.subType === 'earned' ? '+' : '-'}{transaction.points}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {recentTransactions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center" role="status">
            <div className="p-3 sm:p-4 bg-muted/50 rounded-full mb-3 sm:mb-4">
              <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" aria-hidden="true" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1 sm:mb-2">No Transactions Yet</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
              Your transaction history will appear here once you start using credits
            </p>
          </div>
        )}
        <div className="mt-3 sm:mt-4 pt-3 border-t">
          <Button
            variant="outline"
            className="w-full text-xs sm:text-sm h-9 sm:h-10 font-medium hover:bg-primary/5 transition-colors"
            onClick={() => openModal('recentTransactions')}
          >
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" aria-hidden="true" />
            View All Transactions
          </Button>
        </div>
      </CardContent>
    </Card>
    
    <Card className="hover:shadow-lg transition-shadow" role="region" aria-labelledby="campaigns-title">
      <CardHeader>
        <CardTitle className="flex items-center justify-between" id="campaigns-title">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5" aria-hidden="true" />
            My Campaigns
          </div>
          <Button asChild variant="outline" size="sm" aria-label="View all campaigns">
            <PrefetchLink to="/campaigns/my-campaigns">
              View All
            </PrefetchLink>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent aria-labelledby="campaigns-title">
        {campaignsLoading ? (
          <div className="space-y-2" role="status" aria-live="polite" aria-label="Loading campaigns">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
            ))}
            <span className="sr-only">Loading campaigns...</span>
          </div>
        ) : campaigns.length > 0 ? (
          <ul className="space-y-3 list-none" role="list" aria-label="Active campaigns">
            {campaigns.map((campaign) => (
              <li key={campaign.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <div>
                  <p className="font-medium">{campaign.lead_gen_campaigns.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {campaign.leads_received} leads • ${campaign.budget_contribution}/month
                  </p>
                </div>
                <Badge
                  variant={campaign.billing_status === 'active' ? 'default' : 'secondary'}
                  aria-label={`Campaign status: ${campaign.billing_status}`}
                >
                  {campaign.billing_status}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-4" role="status">
            <p className="text-muted-foreground mb-3">No campaigns yet</p>
            <Button asChild size="sm" aria-label="Launch your first campaign">
              <PrefetchLink to="/campaigns/launch">
                <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                Launch Campaign
              </PrefetchLink>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
));