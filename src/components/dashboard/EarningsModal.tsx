
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign } from "lucide-react";
import { useState } from "react";

interface EarningsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalEarnings: number;
}

type TimeScale = "lifetime" | "yearly" | "monthly";

const chartConfig = {
  earnings: {
    label: "Earnings",
    color: "hsl(var(--primary))",
  },
};

// Mock data for different time scales
const mockEarningsData = {
  lifetime: [
    { period: "2023 Q1", earnings: 2500 },
    { period: "2023 Q2", earnings: 4200 },
    { period: "2023 Q3", earnings: 6800 },
    { period: "2023 Q4", earnings: 9200 },
    { period: "2024 Q1", earnings: 12750 },
  ],
  yearly: [
    { period: "2022", earnings: 8500 },
    { period: "2023", earnings: 22700 },
    { period: "2024", earnings: 15750 },
  ],
  monthly: [
    { period: "Sep", earnings: 2100 },
    { period: "Oct", earnings: 3200 },
    { period: "Nov", earnings: 2800 },
    { period: "Dec", earnings: 4100 },
    { period: "Jan", earnings: 3650 },
  ],
};

const getModalTitle = (timeScale: TimeScale) => {
  switch (timeScale) {
    case "lifetime":
      return "Lifetime Earnings";
    case "yearly":
      return "Yearly Earnings";
    case "monthly":
      return "Monthly Earnings";
    default:
      return "Earnings Overview";
  }
};

export function EarningsModal({ open, onOpenChange, totalEarnings }: EarningsModalProps) {
  const [timeScale, setTimeScale] = useState<TimeScale>("lifetime");
  
  const chartData = mockEarningsData[timeScale];
  const currentPeriodEarnings = chartData[chartData.length - 1]?.earnings || 0;
  const previousPeriodEarnings = chartData[chartData.length - 2]?.earnings || 0;
  const growthRate = previousPeriodEarnings > 0 
    ? ((currentPeriodEarnings - previousPeriodEarnings) / previousPeriodEarnings * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>{getModalTitle(timeScale)}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Lifetime Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEarnings.toLocaleString()} pts</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Current Period
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentPeriodEarnings.toLocaleString()} pts</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Growth Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold flex items-center space-x-1 ${
                  growthRate >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  <TrendingUp className="w-4 h-4" />
                  <span>{growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Time Scale Filter */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Earnings Over Time</h3>
            <Select value={timeScale} onValueChange={(value: TimeScale) => setTimeScale(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lifetime">Lifetime</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Earnings Chart */}
          <Card>
            <CardContent className="p-6">
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis 
                      dataKey="period" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value.toLocaleString()}`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="earnings"
                      stroke="var(--color-earnings)"
                      strokeWidth={3}
                      dot={{ fill: "var(--color-earnings)", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "var(--color-earnings)", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
