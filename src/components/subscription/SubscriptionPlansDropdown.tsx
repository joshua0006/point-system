import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { SubscriptionPlan } from "@/hooks/useSubscriptionOperations";

interface SubscriptionPlansDropdownProps {
  plans: SubscriptionPlan[];
  currentCredits?: number;
  isLoading: boolean;
  onPlanSelect: (plan: SubscriptionPlan) => void;
  hasSubscription: boolean;
}

export function SubscriptionPlansDropdown({ 
  plans, 
  currentCredits, 
  isLoading, 
  onPlanSelect, 
  hasSubscription 
}: SubscriptionPlansDropdownProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  const isCurrentPlan = (credits: number) => {
    return hasSubscription && currentCredits === credits;
  };

  const getActionText = (plan: SubscriptionPlan) => {
    if (!hasSubscription) {
      return `Subscribe to ${plan.title}`;
    }
    
    if (currentCredits) {
      return plan.credits > currentCredits 
        ? `Upgrade to ${plan.title}` 
        : `Downgrade to ${plan.title}`;
    }
    
    return `Change to ${plan.title}`;
  };

  const handlePlanChange = (value: string) => {
    setSelectedPlanId(value);
  };

  const handleConfirmSelection = () => {
    const selectedPlan = plans.find(plan => plan.credits.toString() === selectedPlanId);
    if (selectedPlan) {
      onPlanSelect(selectedPlan);
      setSelectedPlanId("");
    }
  };

  const selectedPlan = plans.find(plan => plan.credits.toString() === selectedPlanId);
  const currentPlan = plans.find(plan => isCurrentPlan(plan.credits));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Subscription Plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentPlan && (
          <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
            <Check className="h-4 w-4 text-success" />
            <span className="text-sm">
              Current Plan: <strong>{currentPlan.title}</strong> - {currentPlan.credits} credits/month (S${currentPlan.price})
            </span>
          </div>
        )}

        <div className="space-y-3">
          <Select value={selectedPlanId} onValueChange={handlePlanChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a subscription plan..." />
            </SelectTrigger>
            <SelectContent className="max-h-60 bg-background border border-border shadow-lg z-50">
              {plans.map((plan) => (
                <SelectItem 
                  key={plan.credits} 
                  value={plan.credits.toString()}
                  className="cursor-pointer hover:bg-muted focus:bg-muted py-3"
                  disabled={isCurrentPlan(plan.credits)}
                >
                  <div className="flex items-center justify-between w-full min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="font-medium text-foreground">{plan.title}</div>
                      {isCurrentPlan(plan.credits) && (
                        <Badge variant="secondary" className="text-xs px-2 py-1">Current</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <div className="font-semibold text-primary">S${plan.price}</div>
                        <div className="text-xs text-muted-foreground">per month</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{plan.credits}</div>
                        <div className="text-xs text-muted-foreground">credits</div>
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedPlan && (
            <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-lg">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Selected Plan:</span>
                  <span className="font-bold text-lg text-primary">{selectedPlan.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Monthly Price:</span>
                  <span className="font-bold text-lg">S${selectedPlan.price}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Credits per Month:</span>
                  <span className="font-bold text-lg text-secondary">{selectedPlan.credits}</span>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <div className="text-xs text-muted-foreground text-center">
                    Monthly subscription • Cancel anytime
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleConfirmSelection}
            disabled={!selectedPlan || isLoading || isCurrentPlan(selectedPlan?.credits || 0)}
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                Processing...
              </div>
            ) : selectedPlan && isCurrentPlan(selectedPlan.credits) ? (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Current Plan
              </div>
            ) : selectedPlan ? (
              getActionText(selectedPlan)
            ) : (
              "Select a plan above"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}