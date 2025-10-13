import { CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface CampaignDetails {
  id: string;
  name: string;
  description: string;
  method: 'facebook-ads' | 'cold-calling' | 'va-support';
  targetAudience?: {
    name: string;
    icon: string;
  };
  campaignType?: string;
  budget: number;
  amountDeducted?: number;
  newBalance?: number;
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
  const navigate = useNavigate();

  if (!campaignDetails) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          </div>
          <DialogTitle className="text-xl">Campaign Launched Successfully</DialogTitle>
          <DialogDescription>
            Your campaign is now active
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            {campaignDetails.targetAudience && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target Audience</span>
                <strong>{campaignDetails.targetAudience.name}</strong>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly Budget</span>
              <strong>{campaignDetails.budget} points</strong>
            </div>
            {campaignDetails.amountDeducted && (
              <div className="flex justify-between text-sm pt-3 border-t">
                <span className="text-muted-foreground">Points Deducted</span>
                <span className="tabular-nums">{campaignDetails.amountDeducted?.toLocaleString()} points</span>
              </div>
            )}
            {campaignDetails.newBalance !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">New Balance</span>
                <span className="tabular-nums font-medium">{campaignDetails.newBalance?.toLocaleString()} points</span>
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={() => {
            onClose();
            navigate('/campaigns/my-campaigns');
          }}
          className="w-full"
        >
          View My Campaigns
        </Button>
      </DialogContent>
    </Dialog>
  );
};