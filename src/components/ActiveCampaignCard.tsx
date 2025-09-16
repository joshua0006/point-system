import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Target, Pause, Play, TrendingUp, Users, DollarSign, Calendar, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ActiveCampaignCardProps {
  campaign: any;
  onUpdate: () => void;
}

export const ActiveCampaignCard = ({ campaign, onUpdate }: ActiveCampaignCardProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  const isPaused = campaign.notes === 'PAUSED';

  const pauseCampaign = async () => {
    try {
      setIsProcessing(true);
      
      const { error } = await supabase
        .from('campaign_participants')
        .update({ notes: 'PAUSED' })
        .eq('id', campaign.id);

      if (error) throw error;

      // Send pause notification emails
      try {
        const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-campaign-launch-emails', {
          body: {
            emailType: 'pause',
            campaignId: campaign.id,
            campaignName: campaign.campaign_name || 'Campaign',
            campaignType: 'facebook-ads',
            budget: campaign.budget_contribution,
            userEmail: campaign.user_email || 'user@example.com',
            userName: campaign.user_full_name || 'User',
            action: 'pause'
          }
        });

        if (emailError) {
          console.error('Failed to send pause notification emails:', emailError);
        }
      } catch (emailError) {
        console.error('Error sending pause notification emails:', emailError);
      }

      toast({
        title: "Campaign Paused ⏸️",
        description: "Your Facebook ads campaign has been paused. Confirmation emails sent.",
      });

      onUpdate();
      setShowPauseDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pause campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resumeCampaign = async () => {
    try {
      setIsProcessing(true);
      
      const { error } = await supabase
        .from('campaign_participants')
        .update({ notes: null })
        .eq('id', campaign.id);

      if (error) throw error;

      toast({
        title: "Campaign Resumed ▶️",
        description: "Your Facebook ads campaign has been resumed. Monthly charges will continue.",
      });

      onUpdate();
      setShowResumeDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resume campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className={`transition-all duration-300 ${isPaused ? 'opacity-75 border-yellow-200' : 'border-green-200 bg-green-50/30'}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isPaused ? 'bg-yellow-100' : 'bg-blue-100'}`}>
              <Target className={`h-5 w-5 ${isPaused ? 'text-yellow-600' : 'text-blue-600'}`} />
            </div>
            <div>
              <CardTitle className="text-lg">{campaign.consultant_name}'s Campaign</CardTitle>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                ${campaign.budget_contribution}/month
              </p>
            </div>
          </div>
          <Badge variant={isPaused ? 'secondary' : 'default'} className="flex items-center gap-1">
            {isPaused ? (
              <>
                <Pause className="h-3 w-3" />
                Paused
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                Active
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-background rounded-lg border">
            <TrendingUp className="h-4 w-4 text-green-600 mx-auto mb-1" />
            <p className="text-xl font-bold">{campaign.conversions || 0}</p>
            <p className="text-xs text-muted-foreground">Conversions</p>
          </div>
          <div className="text-center p-3 bg-background rounded-lg border">
            <Users className="h-4 w-4 text-blue-600 mx-auto mb-1" />
            <p className="text-xl font-bold">{campaign.impressions || 0}</p>
            <p className="text-xs text-muted-foreground">Impressions</p>
          </div>
        </div>

        {/* Campaign Timeline */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Started: {new Date(campaign.joined_at).toLocaleDateString()}
          </div>
          <div className="text-right">
            <p className="font-medium">Next charge in {30 - Math.floor((Date.now() - new Date(campaign.joined_at).getTime()) / (1000 * 60 * 60 * 24)) % 30} days</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isPaused ? (
            <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
              <DialogTrigger asChild>
                <Button className="flex-1 bg-green-600 hover:bg-green-700">
                  <Play className="h-4 w-4 mr-2" />
                  Resume Campaign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-green-600" />
                    Resume Campaign
                  </DialogTitle>
                  <DialogDescription>
                    Your campaign will resume immediately and you'll be charged ${campaign.budget_contribution} for the next billing cycle.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowResumeDialog(false)} disabled={isProcessing}>
                    Cancel
                  </Button>
                  <Button onClick={resumeCampaign} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Resuming...
                      </>
                    ) : (
                      "Confirm Resume"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Campaign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Pause Campaign
                  </DialogTitle>
                  <DialogDescription>
                    Pausing will stop your ads immediately and prevent charges for the next billing cycle. You can resume anytime.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowPauseDialog(false)} disabled={isProcessing}>
                    Cancel
                  </Button>
                  <Button onClick={pauseCampaign} disabled={isProcessing} variant="secondary">
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Pausing...
                      </>
                    ) : (
                      "Confirm Pause"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isPaused && (
          <div className="mt-3 p-2 bg-yellow-100 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            Campaign is paused. No new leads will be generated.
          </div>
        )}
      </CardContent>
    </Card>
  );
};