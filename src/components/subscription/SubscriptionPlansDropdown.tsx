import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from '@/lib/icons';
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

  const handlePlanClick = (planCredits: number) => {
    const isCurrent = isCurrentPlan(planCredits);
    if (!isCurrent) {
      setSelectedPlanId(planCredits.toString());
    }
  };

  const handleConfirmSelection = () => {
    const selectedPlan = plans.find(plan => plan.credits.toString() === selectedPlanId);
    if (selectedPlan) {
      onPlanSelect(selectedPlan);
      setSelectedPlanId("");
    }
  };

  const selectedPlan = plans.find(plan => plan.credits.toString() === selectedPlanId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Subscription Plan</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Choose a plan that fits your needs • Cancel anytime
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plans Grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {plans.map((plan) => {
            const isCurrent = isCurrentPlan(plan.credits);
            const isSelected = selectedPlanId === plan.credits.toString();

            return (
              <div
                key={plan.credits}
                onClick={() => handlePlanClick(plan.credits)}
                className={`
                  relative p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${isCurrent
                    ? 'border-success bg-success/5 cursor-not-allowed'
                    : isSelected
                    ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/30 hover:bg-muted/20'
                  }
                `}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <Badge
                    variant="default"
                    className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-xs px-2"
                  >
                    Popular
                  </Badge>
                )}

                {/* Plan Content */}
                <div className="space-y-3 text-center">
                  {/* Plan Name */}
                  <div className="font-semibold text-base">
                    {plan.title}
                  </div>

                  {/* Current Badge */}
                  {isCurrent && (
                    <Badge variant="default" className="bg-success text-xs w-full justify-center">
                      <Check className="h-3 w-3 mr-1" />
                      Current
                    </Badge>
                  )}

                  {/* Credits */}
                  <div className="py-2">
                    <div className="text-2xl font-bold text-primary">
                      {plan.credits}
                    </div>
                    <div className="text-xs text-muted-foreground">credits/mo</div>
                  </div>

                  {/* Price */}
                  <div className="pt-2 border-t">
                    <div className="text-xl font-bold">S${plan.price}</div>
                    <div className="text-xs text-muted-foreground">/month</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <Button
          onClick={handleConfirmSelection}
          disabled={!selectedPlan || isLoading || isCurrentPlan(selectedPlan?.credits || 0)}
          className="w-full h-12 text-base font-semibold"
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
            "Select a plan to continue"
          )}
        </Button>

        {/* Footer Info */}
        <div className="text-center text-sm text-muted-foreground pt-2 border-t">
          All unused credits are kept forever
        </div>
      </CardContent>
    </Card>
  );
}
