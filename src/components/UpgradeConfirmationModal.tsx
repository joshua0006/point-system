import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface UpgradeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentPlan?: {
    name: string;
    credits: number;
    price: number;
  };
  newPlan: {
    name: string;
    credits: number;
    price: number;
  };
  upgradeAmount: number;
  loading?: boolean;
}

export const UpgradeConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  currentPlan,
  newPlan,
  upgradeAmount,
  loading = false
}: UpgradeConfirmationModalProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const additionalCredits = currentPlan 
    ? newPlan.credits - currentPlan.credits 
    : newPlan.credits;

  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1, 1);
  const formattedDate = nextBillingDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add more credits</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Here's what happens if you upgrade:
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upgrade Fee Section */}
          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
            <h3 className="font-semibold text-lg mb-2">Upgrade Fee</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">S${upgradeAmount}</span>
              <span className="text-muted-foreground">due today</span>
            </div>
            
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger className="flex items-center justify-between w-full mt-3 p-3 bg-background/50 rounded-lg border border-border/30 hover:bg-background/80 transition-colors">
                <span className="font-medium">+{additionalCredits} additional credits</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="p-3 bg-background/30 rounded-lg text-sm text-muted-foreground">
                  <p>You'll get {additionalCredits} more flexi-credits immediately, bringing your total monthly allocation to {newPlan.credits} credits.</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Next Billing Cycle */}
          <div>
            <h4 className="font-semibold mb-3">Next billing cycle ({formattedDate})</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Your plan will update to S${newPlan.price}/month for {newPlan.credits} credits</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Downgrade anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Credits rollover</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                "Confirm"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};