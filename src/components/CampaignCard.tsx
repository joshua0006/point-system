import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, BarChart3, Calendar, DollarSign, TrendingUp, Pause, Play } from "lucide-react";

// Proper Campaign interface with complete typing
interface LeadGenCampaign {
  id: string;
  name: string;
  status: string;
}

interface Campaign {
  id: string;
  campaign_id: string;
  consultant_name: string;
  budget_contribution: number;
  leads_received: number | null;
  conversions: number | null;
  billing_status: 'active' | 'paused' | 'paused_insufficient_funds' | 'stopped' | 'completed';
  next_billing_date: string | null;
  joined_at: string;
  lead_gen_campaigns?: LeadGenCampaign;
}

interface CampaignCardProps {
  campaign: Campaign;
  Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  typeColor: string;
  statusColor: string;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onViewAnalytics: (id: string) => void;
}

// Helper function to format status text for accessibility
const getStatusText = (status: Campaign['billing_status']): string => {
  const statusMap: Record<Campaign['billing_status'], string> = {
    'active': 'Active',
    'paused': 'Paused',
    'paused_insufficient_funds': 'Paused due to low balance',
    'stopped': 'Stopped',
    'completed': 'Completed'
  };
  return statusMap[status] || status;
};

// Helper function to format status for screen readers
const getStatusAriaLabel = (status: Campaign['billing_status']): string => {
  const ariaMap: Record<Campaign['billing_status'], string> = {
    'active': 'Campaign is currently active and running',
    'paused': 'Campaign is paused',
    'paused_insufficient_funds': 'Campaign paused due to insufficient account balance',
    'stopped': 'Campaign has been stopped',
    'completed': 'Campaign has completed'
  };
  return ariaMap[status] || `Campaign status: ${status}`;
};

export const CampaignCard = React.memo(({
  campaign,
  Icon,
  typeColor,
  statusColor,
  onPause,
  onResume,
  onViewAnalytics
}: CampaignCardProps) => {
  const isActive = campaign.billing_status === 'active';
  const isPaused = campaign.billing_status === 'paused' || campaign.billing_status === 'paused_insufficient_funds';
  const isLowBalance = campaign.billing_status === 'paused_insufficient_funds';
  const campaignName = campaign.lead_gen_campaigns?.name || 'Campaign';
  const conversionRate = campaign.leads_received && campaign.conversions
    ? Math.round((campaign.conversions / campaign.leads_received) * 100)
    : 0;

  return (
    <article
      className="group"
      aria-label={`${campaignName} campaign details`}
    >
      <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
        <CardHeader className="px-4 sm:px-6 pb-3 sm:pb-4">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            {/* Campaign Type Icon and Title */}
            <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
              <div
                className={`p-2 sm:p-2.5 rounded-lg ${typeColor} transition-transform group-hover:scale-105`}
                aria-hidden="true"
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden={true} />
              </div>

              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm sm:text-base md:text-lg mb-1.5 line-clamp-2 leading-tight">
                  {campaignName}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm flex items-center gap-1.5">
                  <span className="sr-only">Consultant:</span>
                  <span className="truncate">{campaign.consultant_name}</span>
                </CardDescription>
              </div>
            </div>

            {/* Status Badge and Settings */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <Badge
                variant="outline"
                className={`${statusColor} font-medium px-2 py-0.5 sm:px-3 sm:py-1 text-xs max-w-[140px] sm:max-w-none truncate`}
                aria-live="polite"
                aria-label={getStatusAriaLabel(campaign.billing_status)}
              >
                {getStatusText(campaign.billing_status)}
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Campaign settings for ${campaignName}`}
              >
                <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                <span className="sr-only">Campaign Settings</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 pt-0 pb-4 sm:pb-5">
          {/* Campaign Statistics Grid */}
          <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-4"
            role="list"
            aria-label="Campaign statistics"
          >
            {/* Monthly Budget */}
            <div role="listitem" className="space-y-0.5 sm:space-y-1">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3" aria-hidden="true" />
                <span>Monthly Budget</span>
              </p>
              <p className="text-sm sm:text-base lg:text-lg font-bold text-foreground">
                {campaign.budget_contribution.toLocaleString()}
                <span className="text-xs font-normal text-muted-foreground ml-1">pts</span>
              </p>
            </div>

            {/* Leads Generated */}
            <div role="listitem" className="space-y-0.5 sm:space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Leads Generated
              </p>
              <p className="text-sm sm:text-base lg:text-lg font-bold text-foreground">
                {(campaign.leads_received || 0).toLocaleString()}
              </p>
            </div>

            {/* Conversions */}
            <div role="listitem" className="space-y-0.5 sm:space-y-1">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" aria-hidden="true" />
                <span>Conversions</span>
              </p>
              <p className="text-sm sm:text-base lg:text-lg font-bold text-foreground">
                {(campaign.conversions || 0).toLocaleString()}
                {conversionRate > 0 && (
                  <span className="text-xs font-normal text-green-600 ml-1">
                    ({conversionRate}%)
                  </span>
                )}
              </p>
            </div>

            {/* Next Billing */}
            <div role="listitem" className="space-y-0.5 sm:space-y-1">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                <span>Next Billing</span>
              </p>
              <p className="text-sm sm:text-base lg:text-lg font-bold text-foreground">
                {campaign.next_billing_date
                  ? new Date(campaign.next_billing_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Low Balance Warning */}
          {isLowBalance && (
            <div
              className="mt-3 sm:mt-4 p-2 sm:p-3 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 rounded-r-lg"
              role="alert"
              aria-live="polite"
            >
              <p className="text-xs sm:text-sm font-medium text-red-800 dark:text-red-200">
                Campaign paused due to insufficient balance. Please top up your account to resume.
              </p>
            </div>
          )}
        </CardContent>

        {/* Card Footer with Primary Actions */}
        {(isActive || isPaused) && (
          <CardFooter className="px-4 sm:px-6 pt-0 pb-4 sm:pb-5 gap-2.5 sm:gap-3 flex-wrap">
            {isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPause(campaign.id)}
                className="flex-1 min-w-[130px] sm:min-w-[140px] focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Pause ${campaignName} campaign`}
              >
                <Pause className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" aria-hidden="true" />
                <span className="text-xs sm:text-sm whitespace-nowrap">Pause Campaign</span>
              </Button>
            )}
            {isPaused && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onResume(campaign.id)}
                className="flex-1 min-w-[130px] sm:min-w-[140px] focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Resume ${campaignName} campaign`}
              >
                <Play className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" aria-hidden="true" />
                <span className="text-xs sm:text-sm whitespace-nowrap">Resume Campaign</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewAnalytics(campaign.id)}
              className="flex-1 min-w-[130px] sm:min-w-[140px] focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`View analytics for ${campaignName} campaign`}
            >
              <BarChart3 className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" aria-hidden="true" />
              <span className="text-xs sm:text-sm whitespace-nowrap">View Analytics</span>
            </Button>
          </CardFooter>
        )}
      </Card>
    </article>
  );
});

CampaignCard.displayName = "CampaignCard";
