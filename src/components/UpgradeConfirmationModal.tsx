import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
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
  prorationDetails?: {
    currentAmount: number;
    newAmount: number;
    prorationAmount: number;
    nextBillingDate: string;
  } | null;
  loading?: boolean;
}

export function UpgradeConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  currentPlan,
  newPlan,
  upgradeAmount,
  prorationDetails,
  loading = false
}: UpgradeConfirmationModalProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();
  
  const additionalCredits = currentPlan 
    ? newPlan.credits - currentPlan.credits 
    : newPlan.credits;

  // Use actual subscription data instead of hardcoded date calculation
  const nextBillingDate = prorationDetails?.nextBillingDate 
    ? new Date(prorationDetails.nextBillingDate) 
    : (() => {
        const date = new Date();
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0));
      })();
  
  const formattedDate = nextBillingDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={isMobile ? "max-w-[90vw] p-4" : "sm:max-w-md"}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {currentPlan ? "Change Your Plan" : "Subscribe to Plan"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {currentPlan 
              ? (upgradeAmount >= 0 
                  ? "Upgrade your plan - you'll only pay the difference for the remaining days this month" 
                  : "Downgrade your plan - new rate applies starting next month")
              : "Here's what happens when you subscribe:"
            }
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
                  <span>Changing to: {newPlan.name}</span>
                  <span>{newPlan.credits} credits</span>
                </div>
                <div className="pt-2 border-t border-border/30">
                  {prorationDetails ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {upgradeAmount >= 0 
                          ? `You'll get ${Math.abs(additionalCredits)} ${additionalCredits >= 0 ? 'additional' : 'fewer'} credits immediately.`
                          : `You'll get ${Math.abs(additionalCredits)} fewer credits starting next month.`
                        }
                      </p>
                      {prorationDetails.prorationAmount > 0 && (
                        <div className="bg-primary/10 rounded p-3 border border-primary/20">
                          <p className="font-medium text-sm text-primary">Proration Details:</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            You'll be charged S${(prorationDetails.prorationAmount / 100).toFixed(2)} immediately for the remaining days in this billing period.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Next billing: {formattedDate}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {upgradeAmount >= 0 
                        ? `You'll get ${Math.abs(additionalCredits)} ${additionalCredits >= 0 ? 'additional' : 'fewer'} credits immediately and be charged S$${upgradeAmount} for the remaining days.`
                        : `You'll get ${Math.abs(additionalCredits)} fewer credits and save money starting next month.`
                      }
                    </p>
                  )}
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
                   {currentPlan ? 
                     (additionalCredits >= 0 
                       ? `+${additionalCredits} additional credits immediately`
                       : `${Math.abs(additionalCredits)} fewer credits (but lower cost)`
                     ) 
                     : `${newPlan.credits} credits per month`
                   }
                 </span>
               </div>
               <div className="flex items-center gap-2">
                 <CheckCircle className="h-4 w-4 text-green-600" />
                 <span className="text-sm">
                   {currentPlan ? 
                     (upgradeAmount >= 0 
                       ? "Prorated billing - only pay the difference" 
                       : "Lower monthly rate starting next billing cycle"
                     ) 
                     : `S${newPlan.price}/month subscription`
                   }
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
               ) : (
                 currentPlan 
                   ? (upgradeAmount >= 0 ? "Confirm Upgrade" : "Confirm Downgrade")
                   : "Confirm Subscription"
               )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};