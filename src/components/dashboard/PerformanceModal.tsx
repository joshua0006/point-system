
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, Star, Users, Target } from "lucide-react";

interface PerformanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const chartConfig = {
  rating: {
    label: "Rating",
    color: "hsl(var(--primary))",
  },
  conversion: {
    label: "Conversion Rate",
    color: "hsl(var(--success))",
  },
};

// Mock performance data over time
const performanceData = [
  { month: "Jul", rating: 4.5, conversion: 78 },
  { month: "Aug", rating: 4.6, conversion: 82 },
  { month: "Sep", rating: 4.7, conversion: 79 },
  { month: "Oct", rating: 4.8, conversion: 85 },
  { month: "Nov", rating: 4.8, conversion: 85 },
];

// Mock detailed metrics
const detailedMetrics = {
  totalOrders: 127,
  completedOrders: 118,
  averageResponseTime: "2.3 hours",
  repeatCustomers: "32%",
  positiveReviews: "94%",
  onTimeDelivery: "96%"
};

export function PerformanceModal({ open, onOpenChange }: PerformanceModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Performance Analytics</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
                  <Star className="w-4 h-4" />
                  <span>Average Rating</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">4.8</div>
                <p className="text-xs text-muted-foreground">out of 5 stars</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>Conversion Rate</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">85%</div>
                <p className="text-xs text-muted-foreground">inquiries to orders</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Total Orders</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{detailedMetrics.totalOrders}</div>
                <p className="text-xs text-muted-foreground">lifetime orders</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Completed Orders:</span>
                  <div className="font-semibold">{detailedMetrics.completedOrders}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Average Response:</span>
                  <div className="font-semibold">{detailedMetrics.averageResponseTime}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Repeat Customers:</span>
                  <div className="font-semibold">{detailedMetrics.repeatCustomers}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Positive Reviews:</span>
                  <div className="font-semibold text-success">{detailedMetrics.positiveReviews}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">On-Time Delivery:</span>
                  <div className="font-semibold text-success">{detailedMetrics.onTimeDelivery}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      yAxisId="rating"
                      orientation="left"
                      domain={[4, 5]}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      yAxisId="conversion"
                      orientation="right"
                      domain={[70, 90]}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      yAxisId="rating"
                      type="monotone"
                      dataKey="rating"
                      stroke="var(--color-rating)"
                      strokeWidth={3}
                      dot={{ fill: "var(--color-rating)", strokeWidth: 2, r: 4 }}
                    />
                    <Line
                      yAxisId="conversion"
                      type="monotone"
                      dataKey="conversion"
                      stroke="var(--color-conversion)"
                      strokeWidth={3}
                      dot={{ fill: "var(--color-conversion)", strokeWidth: 2, r: 4 }}
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
