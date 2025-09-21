import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
      <CardContent className="space-y-6">
        {currentPlan && (
          <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
            <Check className="h-5 w-5 text-success flex-shrink-0" />
            <div>
              <div className="font-semibold text-success">Current Plan: {currentPlan.title}</div>
              <div className="text-sm text-muted-foreground">
                {currentPlan.credits} credits/month • S${currentPlan.price}/month
              </div>
            </div>
          </div>
        )}

        <RadioGroup value={selectedPlanId} onValueChange={handlePlanChange} className="space-y-3">
          {plans.map((plan) => {
            const isCurrent = isCurrentPlan(plan.credits);
            return (
              <div key={plan.credits} className="relative">
                <Label
                  htmlFor={`plan-${plan.credits}`}
                  className={`
                    flex items-center space-x-4 p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${isCurrent 
                      ? 'border-success bg-success/5 cursor-not-allowed opacity-75' 
                      : selectedPlanId === plan.credits.toString()
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    }
                  `}
                >
                  <RadioGroupItem
                    value={plan.credits.toString()}
                    id={`plan-${plan.credits}`}
                    disabled={isCurrent}
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">{plan.title}</span>
                        {isCurrent && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">S${plan.price}</div>
                        <div className="text-sm text-muted-foreground">per month</div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-muted-foreground">
                        {plan.credits} flexi-credits included monthly
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>

        <Button
          onClick={handleConfirmSelection}
          disabled={!selectedPlan || isLoading || isCurrentPlan(selectedPlan?.credits || 0)}
          className="w-full h-12 text-lg"
          size="lg"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              Processing...
            </div>
          ) : selectedPlan && isCurrentPlan(selectedPlan.credits) ? (
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              Current Plan
            </div>
          ) : selectedPlan ? (
            getActionText(selectedPlan)
          ) : (
            "Select a plan above"
          )}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          Cancel anytime • Keep all unused credits forever
        </div>
      </CardContent>
    </Card>
  );
}