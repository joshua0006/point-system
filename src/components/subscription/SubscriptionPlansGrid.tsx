import { PlanCard } from "./PlanCard";
import { SubscriptionPlan } from "@/hooks/useSubscriptionOperations";
import { useIsMobile } from "@/hooks/use-mobile";

interface SubscriptionPlansGridProps {
  plans: SubscriptionPlan[];
  currentCredits?: number;
  isLoading: boolean;
  onPlanSelect: (plan: SubscriptionPlan) => void;
  hasSubscription: boolean;
}

export function SubscriptionPlansGrid({ 
  plans, 
  currentCredits, 
  isLoading, 
  onPlanSelect, 
  hasSubscription 
}: SubscriptionPlansGridProps) {
  const isMobile = useIsMobile();

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

  return (
    <div className={isMobile ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"}>
      {plans.map((plan) => (
        <PlanCard
          key={plan.credits}
          plan={plan}
          isCurrentPlan={isCurrentPlan(plan.credits)}
          isLoading={isLoading}
          onSelect={onPlanSelect}
          actionText={getActionText(plan)}
        />
      ))}
    </div>
  );
}