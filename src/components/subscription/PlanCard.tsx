import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { SubscriptionPlan } from "@/hooks/useSubscriptionOperations";

interface PlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
  isLoading: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
  actionText: string;
}

export function PlanCard({ plan, isCurrentPlan, isLoading, onSelect, actionText }: PlanCardProps) {
  return (
    <Card 
      className={`relative border-2 transition-all hover:shadow-lg ${
        isCurrentPlan
          ? 'border-success bg-success/5 shadow-lg scale-105' 
          : 'border-border hover:border-primary/50'
      }`}
    >
      {isCurrentPlan && (
        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-success">
          Current Plan
        </Badge>
      )}
      
      <CardContent className="p-6 text-center">
        <h3 className="font-semibold text-lg mb-2">{plan.title}</h3>
        
        <div className="mb-4">
          <div className="text-3xl font-bold">
            S${plan.price}
          </div>
          <div className="text-sm text-muted-foreground">
            per month
          </div>
          <div className="text-sm font-medium text-primary">
            {plan.credits} flexi-credits/month
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground mb-6 text-center">
          Monthly subscription
        </div>
        
        <Button
          onClick={() => onSelect(plan)}
          disabled={isLoading || isCurrentPlan}
          className={`w-full ${
            isCurrentPlan
              ? 'bg-success hover:bg-success'
              : ''
          }`}
          variant={isCurrentPlan ? "default" : "outline"}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              Processing...
            </div>
          ) : isCurrentPlan ? (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Current Plan
            </div>
          ) : (
            actionText
          )}
        </Button>
      </CardContent>
    </Card>
  );
}