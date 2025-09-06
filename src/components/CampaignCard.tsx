import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pause, Play, Settings, BarChart3, Calendar, DollarSign } from "lucide-react";

interface CampaignCardProps {
  campaign: any;
  Icon: React.ComponentType<{ className?: string }>;
  typeColor: string;
  statusColor: string;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}

export const CampaignCard = React.memo(({ 
  campaign, 
  Icon, 
  typeColor, 
  statusColor, 
  onPause, 
  onResume 
}: CampaignCardProps) => {
  const isActive = campaign.billing_status === 'active';
  const isPaused = campaign.billing_status === 'paused' || campaign.billing_status === 'paused_insufficient_funds';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${typeColor}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">
                {campaign.lead_gen_campaigns?.name || 'Campaign'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Consultant: {campaign.consultant_name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={statusColor}>
              {campaign.billing_status === 'paused_insufficient_funds' 
                ? 'Paused (Low Balance)'
                : campaign.billing_status === 'stopped'
                ? 'Stopped'
                : campaign.billing_status.charAt(0).toUpperCase() + campaign.billing_status.slice(1)
              }
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isActive && (
                  <DropdownMenuItem onClick={() => onPause(campaign.id)}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Campaign
                  </DropdownMenuItem>
                )}
                {isPaused && (
                  <DropdownMenuItem onClick={() => onResume(campaign.id)}>
                    <Play className="h-4 w-4 mr-2" />
                    Resume Campaign
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Campaign Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Monthly Budget</p>
            <p className="font-medium flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {campaign.budget_contribution} pts
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Leads Generated</p>
            <p className="font-medium">{campaign.leads_received || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Conversions</p>
            <p className="font-medium">{campaign.conversions || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Next Billing</p>
            <p className="font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {campaign.next_billing_date ? new Date(campaign.next_billing_date).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        {campaign.billing_status === 'paused_insufficient_funds' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              Campaign paused due to insufficient balance. Please top up your account to resume.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

CampaignCard.displayName = "CampaignCard";