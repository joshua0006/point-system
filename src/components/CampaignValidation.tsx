import { AlertTriangle, CheckCircle, DollarSign, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CampaignValidationProps {
  budgetAmount: string;
  consultantName: string;
  userBalance: number;
  selectedTarget: any;
}

export const CampaignValidation = ({ budgetAmount, consultantName, userBalance, selectedTarget }: CampaignValidationProps) => {
  const budget = parseInt(budgetAmount) || 0;
  const errors = [];
  const warnings = [];

  // Validation checks
  if (!selectedTarget) {
    errors.push("Please select a target audience");
  }

  if (!consultantName.trim()) {
    errors.push("Consultant name is required");
  }

  if (!budgetAmount || budget <= 0) {
    errors.push("Monthly budget must be greater than $0");
  } else if (budget < 100) {
    warnings.push("Budgets under $100 may not generate significant leads");
  } else if (budget > 5000) {
    warnings.push("Consider starting with a smaller budget to test performance");
  }

  if (budget > userBalance) {
    errors.push(`Insufficient balance. You need $${budget} but only have $${userBalance}`);
  }

  const isValid = errors.length === 0;

  return (
    <div className="space-y-3">
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && errors.length === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {isValid && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Campaign configuration looks good! Ready to launch.
          </AlertDescription>
        </Alert>
      )}

      {/* Budget breakdown */}
      {budget > 0 && (
        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Budget Breakdown
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Monthly spend:</span>
              <p className="font-medium">${budget}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Expected leads:</span>
              <p className="font-medium">{Math.round(budget * 0.02)} - {Math.round(budget * 0.03)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Cost per lead:</span>
              <p className="font-medium">${Math.round(budget / (budget * 0.025))}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Balance after:</span>
              <p className={`font-medium ${userBalance - budget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${userBalance - budget}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};