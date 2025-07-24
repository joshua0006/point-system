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
            Campaign Submitted Successfully! 🎉
          </DialogTitle>
          <p className="text-muted-foreground mt-2">
            Your campaign has been submitted and is pending admin activation
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Important Notice */}
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Camera className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-amber-800 dark:text-amber-200">
                    Action Required: Send Screenshot to Admin
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Please take a screenshot of this page and send it to our admin team to activate your campaign.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Details */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Campaign Details</h3>
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
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    Pending Activation
                  </Badge>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Submitted:</span>
                  <span className="font-semibold">{new Date().toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Contact Info */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
            <CardContent className="p-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Admin Contact Information
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Email: <span className="font-mono">admin@yourcompany.com</span>
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                Please include your campaign ID in all communications.
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleSendEmail} className="flex-1" variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Send to Admin
            </Button>
            <Button onClick={handleDownloadDetails} className="flex-1" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Details
            </Button>
            <Button onClick={onClose} className="flex-1">
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};