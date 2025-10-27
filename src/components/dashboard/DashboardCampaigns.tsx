import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PrefetchLink } from "@/components/navigation";
import { Target, Plus } from "lucide-react";

interface DashboardCampaignsProps {
  campaigns: any[];
  campaignsLoading: boolean;
}

export const DashboardCampaigns = memo(({
  campaigns,
  campaignsLoading
}: DashboardCampaignsProps) => (
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
            <li key={campaign.id} className="flex justify-between items-center gap-3 py-2 border-b last:border-b-0">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate" title={campaign.lead_gen_campaigns.name}>{campaign.lead_gen_campaigns.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {campaign.leads_received} leads • ${campaign.budget_contribution}/month
                </p>
              </div>
              <Badge
                variant={campaign.billing_status === 'active' ? 'default' : 'secondary'}
                aria-label={`Campaign status: ${campaign.billing_status}`}
                className="flex-shrink-0"
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
));
