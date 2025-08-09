import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, Target, DollarSign, AlertCircle } from "lucide-react";

interface BudgetProjection {
  budget: number;
  expectedLeads: number;
  costPerLead: number;
  estimatedRevenue: number;
  roi: number;
  dailySpend: number;
}

interface SmartBudgetCalculatorProps {
  selectedTarget?: string;
  onBudgetChange: (budget: number) => void;
  userBalance: number;
}

const TARGET_BENCHMARKS = {
  nsf: { avgCostPerLead: 22, conversionRate: 0.15, avgDealValue: 800 },
  mothers: { avgCostPerLead: 25, conversionRate: 0.18, avgDealValue: 1200 },
  general: { avgCostPerLead: 18, conversionRate: 0.12, avgDealValue: 900 },
  seniors: { avgCostPerLead: 30, conversionRate: 0.14, avgDealValue: 1500 }
};

export const SmartBudgetCalculator = ({ 
  selectedTarget = 'general', 
  onBudgetChange, 
  userBalance 
}: SmartBudgetCalculatorProps) => {
  const [budget, setBudget] = useState(500);
  
  const [projection, setProjection] = useState<BudgetProjection | null>(null);

  useEffect(() => {
    calculateProjection();
  }, [budget, selectedTarget]);

  const calculateProjection = () => {
    const benchmark = TARGET_BENCHMARKS[selectedTarget as keyof typeof TARGET_BENCHMARKS] || TARGET_BENCHMARKS.general;
    
    const expectedLeads = Math.floor(budget / benchmark.avgCostPerLead);
    const estimatedRevenue = expectedLeads * benchmark.conversionRate * benchmark.avgDealValue;
    const roi = ((estimatedRevenue - budget) / budget) * 100;
    
    setProjection({
      budget,
      expectedLeads,
      costPerLead: benchmark.avgCostPerLead,
      estimatedRevenue,
      roi,
      dailySpend: budget / 30
    });
  };

  const handleBudgetChange = (value: number[]) => {
    const newBudget = value[0];
    setBudget(newBudget);
    onBudgetChange(newBudget);
  };

  const getRoiColor = (roi: number) => {
    if (roi >= 200) return 'text-green-600 bg-green-50';
    if (roi >= 100) return 'text-blue-600 bg-blue-50';
    if (roi >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getRoiLabel = (roi: number) => {
    if (roi >= 200) return 'Excellent';
    if (roi >= 100) return 'Good';
    if (roi >= 50) return 'Fair';
    return 'Poor';
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-blue-500" />
          <CardTitle className="text-lg">Smart Budget Calculator</CardTitle>
          <Badge variant="secondary" className="ml-auto">AI-Powered</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Get real-time projections based on industry benchmarks and your target audience
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Budget Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Campaign Budget</label>
            <div className="text-sm text-muted-foreground">
              {budget} points (S${budget})
            </div>
          </div>
          <Slider
            value={[budget]}
            onValueChange={handleBudgetChange}
            max={Math.min(userBalance, 3000)}
            min={500}
            step={100}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>S$500</span>
            <span>S${Math.min(userBalance, 3000)}</span>
          </div>
          {budget > userBalance && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3" />
              Insufficient balance (You have {userBalance} points)
            </div>
          )}
        </div>


        {/* Projections */}
        {projection && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="h-4 w-4 text-blue-500" />
                <div className="text-sm font-medium">Expected Leads</div>
              </div>
              <div className="text-2xl font-bold">{projection.expectedLeads}</div>
               <div className="text-xs text-muted-foreground">
                 Quality leads
               </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <DollarSign className="h-4 w-4 text-green-500" />
                <div className="text-sm font-medium">Est. Revenue</div>
              </div>
               <div className="text-2xl font-bold">
                 S${projection.estimatedRevenue.toFixed(0)}
               </div>
              <div className="text-xs text-muted-foreground">
                Based on benchmarks
              </div>
            </div>
            
            <div className="text-center col-span-2">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <div className="text-sm font-medium">Projected ROI</div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="text-2xl font-bold">
                  {projection.roi > 0 ? '+' : ''}{projection.roi.toFixed(0)}%
                </div>
                <Badge className={getRoiColor(projection.roi)}>
                  {getRoiLabel(projection.roi)}
                </Badge>
              </div>
               <div className="text-xs text-muted-foreground mt-1">
                 Daily spend: S${projection.dailySpend.toFixed(0)}
               </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Projections based on historical performance data and industry benchmarks
        </div>
      </CardContent>
    </Card>
  );
};