import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Target, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { useServiceAssignments } from "@/hooks/useServiceAssignments";
import { useAuth } from "@/contexts/AuthContext";

export function FacebookAdsCampaigns() {
  const { user } = useAuth();
  const { fetchUserAssignments } = useServiceAssignments();
  const { data: assignments = [], isLoading } = fetchUserAssignments(user?.id || '');

  const facebookAdsAssignments = assignments.filter(assignment => 
    assignment.service_type === 'facebook_ads'
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Facebook Ads Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Loading campaigns...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (facebookAdsAssignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Facebook Ads Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No Facebook Ads campaigns assigned</p>
            <p className="text-sm">Contact your account manager to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Facebook Ads Campaigns ({facebookAdsAssignments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {facebookAdsAssignments.map((campaign) => (
            <div key={campaign.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Facebook Ads Campaign</h4>
                    <Badge 
                      variant={campaign.campaign_status === 'active' ? 'default' : 'secondary'}
                    >
                      {campaign.campaign_status || 'pending'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>${campaign.monthly_cost.toLocaleString()}/month</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Target className="h-4 w-4" />
                      <span>{campaign.target_audience || 'General audience'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Next billing: {format(new Date(campaign.next_billing_date), 'MMM d, yyyy')}</span>
                    </div>
                  </div>

                  {campaign.campaign_duration_months && (
                    <div className="text-sm text-muted-foreground">
                      Campaign duration: {campaign.campaign_duration_months} months
                    </div>
                  )}

                  {campaign.notes && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Notes:</strong> {campaign.notes}
                    </div>
                  )}
                </div>

                {campaign.campaign_status === 'active' && campaign.campaign_id && (
                  <Button size="sm" variant="outline">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    View Performance
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}