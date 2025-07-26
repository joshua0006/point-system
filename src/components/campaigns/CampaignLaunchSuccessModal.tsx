import { CheckCircle, Download, Mail, Camera, Target, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface CampaignDetails {
  id: string;
  name: string;
  description: string;
  method: 'facebook-ads' | 'cold-calling';
  targetAudience?: {
    name: string;
    icon: string;
  };
  campaignType?: string;
  budget: number;
  consultantName: string;
  hours?: number;
}

interface CampaignLaunchSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignDetails: CampaignDetails;
}

export const CampaignLaunchSuccessModal = ({ 
  isOpen, 
  onClose, 
  campaignDetails 
}: CampaignLaunchSuccessModalProps) => {
  const isFacebookAds = campaignDetails.method === 'facebook-ads';
  const IconComponent = isFacebookAds ? Target : Phone;
  const iconColor = isFacebookAds ? 'text-blue-600' : 'text-green-600';
  const bgColor = isFacebookAds ? 'bg-blue-500/10' : 'bg-green-500/10';

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Campaign Activation Request - ${campaignDetails.name}`);
    const body = encodeURIComponent(`
Hi Admin,

I have successfully submitted a new campaign and need it activated:

Campaign Details:
- Campaign ID: ${campaignDetails.id}
- Name: ${campaignDetails.name}
- Type: ${isFacebookAds ? 'Facebook Ads' : 'Cold Calling'}
- Target Audience: ${campaignDetails.targetAudience?.name || 'N/A'}
- Campaign Type: ${campaignDetails.campaignType || 'N/A'}
- Monthly Budget: ${campaignDetails.budget} points
- Consultant: ${campaignDetails.consultantName}
${campaignDetails.hours ? `- Hours per month: ${campaignDetails.hours}` : ''}

Please review and activate this campaign.

Thank you!
    `);
    
    window.open(`mailto:admin@yourcompany.com?subject=${subject}&body=${body}`);
  };

  const handleDownloadDetails = () => {
    const campaignText = `
Campaign Submission Details
==========================

Campaign ID: ${campaignDetails.id}
Name: ${campaignDetails.name}
Description: ${campaignDetails.description}

Campaign Type: ${isFacebookAds ? 'Facebook Ads' : 'Cold Calling'}
Target Audience: ${campaignDetails.targetAudience?.name || 'N/A'}
Campaign Type: ${campaignDetails.campaignType || 'N/A'}
Monthly Budget: ${campaignDetails.budget} points
Consultant: ${campaignDetails.consultantName}
${campaignDetails.hours ? `Hours per month: ${campaignDetails.hours}` : ''}

Submission Date: ${new Date().toLocaleString()}
Status: Pending Activation

Next Steps:
1. Take a screenshot of this information
2. Send to admin@yourcompany.com
3. Wait for campaign activation
    `;

    const blob = new Blob([campaignText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-${campaignDetails.id}-details.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-6">
          <div className="mx-auto mb-4 relative">
            <div className={`${bgColor} p-4 rounded-full inline-block`}>
              <IconComponent className={`h-12 w-12 ${iconColor}`} />
            </div>
            <CheckCircle className="h-8 w-8 text-green-500 absolute -bottom-1 -right-1 bg-background rounded-full" />
          </div>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Campaign Activated Successfully! 🎉
          </DialogTitle>
          <p className="text-muted-foreground mt-2">
            Your campaign is now active and running
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Important Notice */}
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Camera className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-800 dark:text-green-200">
                    Please send screenshot to admin for confirmation
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Take a screenshot of this confirmation page and send it to admin@yourcompany.com
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Details */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Campaign Confirmation</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Campaign ID:</span>
                  <span className="font-mono text-sm font-semibold">{campaignDetails.id}</span>
                </div>
                
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Campaign Name:</span>
                  <span className="font-semibold text-right max-w-xs">{campaignDetails.name}</span>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="outline" className={bgColor}>
                    {isFacebookAds ? 'Facebook Ads' : 'Cold Calling'}
                  </Badge>
                </div>

                {campaignDetails.targetAudience && (
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Target Audience:</span>
                    <span className="font-semibold">{campaignDetails.targetAudience.name}</span>
                  </div>
                )}

                {campaignDetails.campaignType && (
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Campaign Type:</span>
                    <span className="font-semibold text-right max-w-xs">{campaignDetails.campaignType}</span>
                  </div>
                )}

                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Monthly Budget:</span>
                  <Badge variant="secondary">{campaignDetails.budget} points</Badge>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Consultant:</span>
                  <span className="font-semibold">{campaignDetails.consultantName}</span>
                </div>

                {campaignDetails.hours && (
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Hours per Month:</span>
                    <span className="font-semibold">{campaignDetails.hours} hours</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
                  </Badge>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Activated:</span>
                  <span className="font-semibold">{new Date().toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <Button onClick={onClose} className="w-full">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};