import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TrendingUp, Target, Plus } from "lucide-react";
import { Transaction } from "@/hooks/useDashboardData";
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
          <div key={transaction.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
            <div>
              <p className="font-medium">{transaction.service}</p>
              <p className="text-sm text-muted-foreground">{transaction.date}</p>
            </div>
            <div className={`font-semibold ${transaction.type === 'earned' ? 'text-success' : 'text-destructive'}`}>
              {transaction.type === 'earned' ? '+' : '-'}{transaction.points} credits
            </div>
          </div>
        ))}
        {recentTransactions.length === 0 && (
          <p className="text-muted-foreground text-center py-4">No transactions yet</p>
        )}
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