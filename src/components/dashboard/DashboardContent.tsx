import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TrendingUp, Target, Plus } from "lucide-react";
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
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => openModal('recentTransactions')}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentTransactions.map((transaction) => (
          <div key={transaction.id} className="flex justify-between items-center py-3 border-b last:border-b-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                <span className="text-sm">{transaction.icon}</span>
              </div>
              <div>
                <p className="font-medium text-sm">{transaction.service}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">{transaction.date}</p>
                  <Badge variant="secondary" className="text-xs">
                    {transaction.category}
                  </Badge>
                </div>
              </div>
            </div>
            <div className={`font-semibold text-sm ${
              transaction.subType === 'earned' 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {transaction.subType === 'earned' ? '+' : '-'}{transaction.points} credits
            </div>
          </div>
        ))}
        {recentTransactions.length === 0 && (
          <p className="text-muted-foreground text-center py-4">No transactions yet</p>
        )}
        <div className="mt-4 pt-3 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => openModal('recentTransactions')}
            className="w-full"
          >
            View All Transactions
          </Button>
        </div>
      </CardContent>
    </Card>
    
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            My Campaigns
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/campaigns/my-campaigns">
              View All
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {campaignsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : campaigns.length > 0 ? (
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <div>
                  <p className="font-medium">{campaign.lead_gen_campaigns.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {campaign.leads_received} leads • ${campaign.budget_contribution}/month
                  </p>
                </div>
                <Badge variant={campaign.billing_status === 'active' ? 'default' : 'secondary'}>
                  {campaign.billing_status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-3">No campaigns yet</p>
            <Button asChild size="sm">
              <Link to="/campaigns/launch">
                <Plus className="w-4 h-4 mr-2" />
                Launch Campaign
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
));