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
          <DialogTitle className="text-xl font-bold">Upgrade your plan</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {currentPlan ? "You'll be taken to your billing portal to change your plan:" : "Here's what happens when you subscribe:"}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Change Details */}
          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
            <h3 className="font-semibold text-lg mb-2">
              {currentPlan ? "Plan Change" : "New Subscription"}
            </h3>
            {currentPlan ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Current: {currentPlan.name}</span>
                  <span>{currentPlan.credits} credits</span>
                </div>
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Upgrading to: {newPlan.name}</span>
                  <span>{newPlan.credits} credits</span>
                </div>
                <div className="pt-2 border-t border-border/30">
                  <p className="text-sm text-muted-foreground">
                    Your billing will be prorated automatically. You'll immediately get access to {additionalCredits} additional credits.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">S${newPlan.price}</span>
                <span className="text-muted-foreground">per month</span>
              </div>
            )}
          </div>

          {/* Benefits */}
          <div>
            <h4 className="font-semibold mb-3">What you get:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  {currentPlan ? `+${additionalCredits} additional credits immediately` : `${newPlan.credits} credits per month`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  {currentPlan ? "Prorated billing - only pay the difference" : `S${newPlan.price}/month subscription`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Change or cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Credits rollover monthly</span>
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
              ) : currentPlan ? (
                "Go to Billing Portal"
              ) : (
                "Subscribe Now"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};