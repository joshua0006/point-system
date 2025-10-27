import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Users,
  MapPin,
  Calendar,
  Award,
  BarChart3,
  Clock
} from '@/lib/icons';
import { CampaignAnalytics } from "@/utils/campaignAnalytics";
import { useIsMobile } from "@/hooks/use-mobile";

interface CampaignAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  analytics: CampaignAnalytics | null;
}

export const CampaignAnalyticsModal: React.FC<CampaignAnalyticsModalProps> = ({
  isOpen,
  onClose,
  analytics
}) => {
  const isMobile = useIsMobile();

  if (!analytics) return null;

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatNumber = (value: number) => value.toLocaleString();
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`${isMobile ? 'max-w-[95vw]' : 'max-w-[90vw]'} max-h-[90vh] overflow-y-auto`}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Campaign Analytics
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline" className="font-medium">
              {analytics.campaignName}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {analytics.campaignType.replace('-', ' ')}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {new Date(analytics.dateRange.startDate).toLocaleDateString()} - {new Date(analytics.dateRange.endDate).toLocaleDateString()}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Performance Overview */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Performance Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Leads</p>
                  <p className="text-2xl font-bold">{formatNumber(analytics.performance.totalLeads)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Conversions</p>
                  <p className="text-2xl font-bold text-green-600">{formatNumber(analytics.performance.totalConversions)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Conv. Rate</p>
                  <p className="text-2xl font-bold">{formatPercent(analytics.performance.conversionRate)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Spend</p>
                  <p className="text-2xl font-bold">{formatCurrency(analytics.performance.totalSpend)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Cost/Lead</p>
                  <p className="text-2xl font-bold">{formatCurrency(analytics.performance.costPerLead)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">ROI</p>
                  <p className={`text-2xl font-bold ${analytics.performance.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(analytics.performance.roi)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Recent Performance - Last 7 Days */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Recent Performance (Last 7 Days)
            </h3>
            <Card>
              <CardContent className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Date</th>
                        <th className="text-right py-2 font-medium">Leads</th>
                        <th className="text-right py-2 font-medium">Conversions</th>
                        <th className="text-right py-2 font-medium">Spend</th>
                        <th className="text-right py-2 font-medium">Conv. Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.timeSeries.slice(-7).map((day, index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-2">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                          <td className="text-right font-medium">{day.leads}</td>
                          <td className="text-right font-medium text-green-600">{day.conversions}</td>
                          <td className="text-right">{formatCurrency(day.spend)}</td>
                          <td className="text-right">{formatPercent((day.conversions / day.leads) * 100)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Lead Sources */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Lead Sources
              </h3>
              <Card>
                <CardContent className="p-4 space-y-4">
                  {analytics.leadSources.map((source, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{source.source}</span>
                        <span className="text-muted-foreground">
                          {formatNumber(source.leads)} leads ({formatPercent(source.percentage)})
                        </span>
                      </div>
                      <Progress value={source.percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatNumber(source.conversions)} conversions</span>
                        <span>{formatPercent(source.conversionRate)} conv. rate</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>

            {/* Geographic Distribution */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Geographic Distribution
              </h3>
              <Card>
                <CardContent className="p-4 space-y-4">
                  {analytics.geographic.map((location, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{location.location}</span>
                        <span className="text-muted-foreground">
                          {formatNumber(location.leads)} leads ({formatPercent(location.percentage)})
                        </span>
                      </div>
                      <Progress value={location.percentage} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {formatNumber(location.conversions)} conversions
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Trends */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Week-over-Week Trends
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {analytics.trends.map((trend, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-2">{trend.metric}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">{formatNumber(trend.current)}</p>
                        <p className="text-xs text-muted-foreground">from {formatNumber(trend.previous)}</p>
                      </div>
                      <div className={`flex items-center gap-1 ${trend.changePercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend.changePercentage >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        <span className="font-bold">{Math.abs(trend.changePercentage)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Peak Performance */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Peak Performance
              </h3>
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-1">🏆 Best Day</p>
                    <p className="text-base font-semibold">{analytics.peakPerformance.bestDay.day}</p>
                    <p className="text-sm text-muted-foreground">{formatNumber(analytics.peakPerformance.bestDay.leads)} leads</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1 flex items-center gap-1">
                      <Clock className="h-4 w-4" /> Best Hour
                    </p>
                    <p className="text-base font-semibold">{analytics.peakPerformance.bestHour.hour}</p>
                    <p className="text-sm text-muted-foreground">{formatNumber(analytics.peakPerformance.bestHour.leads)} leads</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Lowest Day</p>
                    <p className="text-base font-semibold">{analytics.peakPerformance.worstDay.day}</p>
                    <p className="text-sm text-muted-foreground">{formatNumber(analytics.peakPerformance.worstDay.leads)} leads</p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Goals Progress */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Goals Progress
              </h3>
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Lead Goal</span>
                      <span className="text-muted-foreground">
                        {formatNumber(analytics.performance.totalLeads)} / {formatNumber(analytics.goals.leadGoal)}
                      </span>
                    </div>
                    <Progress value={analytics.goals.leadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{formatPercent(analytics.goals.leadProgress)} complete</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Conversion Goal</span>
                      <span className="text-muted-foreground">
                        {formatNumber(analytics.performance.totalConversions)} / {formatNumber(analytics.goals.conversionGoal)}
                      </span>
                    </div>
                    <Progress value={analytics.goals.conversionProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{formatPercent(analytics.goals.conversionProgress)} complete</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Budget Usage</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(analytics.goals.budgetUsed)} / {formatCurrency(analytics.goals.budgetGoal)}
                      </span>
                    </div>
                    <Progress
                      value={(analytics.goals.budgetUsed / analytics.goals.budgetGoal) * 100}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatPercent((analytics.goals.budgetUsed / analytics.goals.budgetGoal) * 100)} spent
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
