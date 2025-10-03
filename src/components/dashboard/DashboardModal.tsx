import React from 'react';
import { Modal, DataModal } from '@/components/ui/modal';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Plus, DollarSign, Star, Clock, Calendar, MapPin, ArrowUp, ArrowDown, Wallet } from "lucide-react";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { useReviews, useRatingStats } from "@/hooks/useReviews";
import { UserStats } from "@/hooks/useDashboard";
import { useState } from "react";

// Utility function to convert technical transaction names to simple English
const getSimpleTransactionName = (service: string) => {
  if (service?.toLowerCase().includes('stripe checkout payment')) {
    return 'Subscription Payment';
  }
  if (service?.toLowerCase().includes('checkout') && service?.toLowerCase().includes('session')) {
    return 'Subscription Payment';
  }
  if (service?.toLowerCase().includes('subscription')) {
    return 'Monthly Plan Payment';
  }
  if (service?.toLowerCase().includes('points')) {
    return 'Credits Purchase';
  }
  if (service?.toLowerCase().includes('topup') || service?.toLowerCase().includes('top-up')) {
    return 'Account Top-up';
  }
  if (service?.toLowerCase().includes('refund')) {
    return 'Refund';
  }
  if (service?.toLowerCase().includes('consultation')) {
    return 'Consultation Session';
  }
  // Return original if no match found, but remove technical jargon
  return service?.replace(/cs_live_[a-zA-Z0-9]+/g, '').replace(/Session/g, '').trim() || 'Transaction';
};

// Utility function to convert technical status to simple English
const getSimpleStatus = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'succeeded':
    case 'completed':
    case 'paid':
      return 'Completed';
    case 'pending':
      return 'Processing';
    case 'failed':
    case 'canceled':
      return 'Failed';
    case 'refunded':
      return 'Refunded';
    default:
      return status || 'Unknown';
  }
};

// Common interfaces
interface BaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Transaction {
  id: string;
  type: "spent" | "earned";
  service?: string;
  consultant?: string;
  points: number;
  date: string;
  status: string;
}

// Balance Details Modal
interface BalanceDetailsModalProps extends BaseModalProps {
  onTopUp?: () => void;
  onViewUpcomingCharges?: () => void;
  userStats?: UserStats;
}

export function BalanceDetailsModal({ 
  open, 
  onOpenChange, 
  onTopUp, 
  onViewUpcomingCharges,
  userStats 
}: BalanceDetailsModalProps) {
  const { data: transactions, isLoading, error } = useTransactionHistory();

  const defaultStats: UserStats = {
    totalPoints: 0,
    pointsSpent: 0,
    pointsEarned: 0,
    servicesBooked: 0,
    completedSessions: 0,
    totalPointsSpent: 0,
    totalPointsEarned: 0,
    completionRate: 0,
    currentBalance: 0,
    locked_awarded_balance: 0,
    expiring_awarded_credits: [],
  };

  const stats = userStats || defaultStats;

  return (
    <DataModal
      open={open}
      onOpenChange={onOpenChange}
      title="Balance History"
      size="lg"
      loading={isLoading}
      error={error?.message}
      data={transactions}
      emptyMessage="No transactions found. Your transaction history will appear here."
      footer={
        <div className="space-y-2">
          {/* Balance Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${stats.totalPoints < 0 ? 'text-destructive' : 'text-primary'}`}>
                  {stats.totalPoints < 0 ? 'Owes ' : ''}{Math.abs(stats.totalPoints).toLocaleString()}{stats.totalPoints < 0 ? ' pts' : ''}
                </div>
                <p className="text-muted-foreground">
                  {stats.totalPoints < 0 ? 'Total Flexi-Credits Owed' : 'Total Flexi-Credits Available'}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>Credits Earned</span>
                  <ArrowUp className="w-4 h-4 text-success" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  +{stats.pointsEarned.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>Credits Spent</span>
                  <ArrowDown className="w-4 h-4 text-destructive" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  -{stats.pointsSpent.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="pt-4 border-t space-y-2">
            {onTopUp && (
              <Button onClick={onTopUp} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Top Up Credits
              </Button>
            )}
            
            {onViewUpcomingCharges && (
              <Button 
                variant="outline"
                onClick={onViewUpcomingCharges}
                className="w-full"
              >
                <Wallet className="w-4 h-4 mr-2" />
                View Upcoming Charges
              </Button>
            )}
          </div>
        </div>
      }
    >
      <ScrollArea className="h-96">
        <div className="space-y-3">
          {transactions?.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  transaction.type === 'spent' 
                    ? 'bg-destructive/10 text-destructive' 
                    : 'bg-success/10 text-success'
                }`}>
                  {transaction.type === 'spent' ? (
                    <TrendingDown className="w-5 h-5" />
                  ) : (
                    <TrendingUp className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{getSimpleTransactionName(transaction.service || '')}</p>
                  {transaction.consultant && (
                    <p className="text-sm text-muted-foreground">with {transaction.consultant}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{transaction.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold text-lg ${
                  transaction.type === 'spent' ? 'text-destructive' : 'text-success'
                }`}>
                  {transaction.type === 'spent' ? '-' : '+'}{transaction.points}
                </p>
                <Badge variant="outline" className="text-xs">
                  {getSimpleStatus(transaction.status)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </DataModal>
  );
}

// Earnings Modal
interface EarningsModalProps extends BaseModalProps {
  totalEarnings: number;
  onOpenChange: (open: boolean, newFilter?: TimeScale) => void;
}

type TimeScale = "lifetime" | "yearly" | "monthly";

const chartConfig = {
  earnings: {
    label: "Earnings",
    color: "hsl(var(--primary))",
  },
};

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

export function EarningsModal({ open, onOpenChange, totalEarnings }: EarningsModalProps) {
  const [timeScale, setTimeScale] = useState<TimeScale>("lifetime");
  
  const chartData = mockEarningsData[timeScale];
  const currentPeriodEarnings = chartData[chartData.length - 1]?.earnings || 0;
  const previousPeriodEarnings = chartData[chartData.length - 2]?.earnings || 0;
  const growthRate = previousPeriodEarnings > 0 
    ? ((currentPeriodEarnings - previousPeriodEarnings) / previousPeriodEarnings * 100)
    : 0;

  const getModalTitle = (timeScale: TimeScale) => {
    switch (timeScale) {
      case "lifetime": return "Lifetime Earnings";
      case "yearly": return "Yearly Earnings";
      case "monthly": return "Monthly Earnings";
      default: return "Earnings Overview";
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(open) => onOpenChange(open, timeScale)}
      title={getModalTitle(timeScale)}
      size="xl"
      className="max-h-[90vh] overflow-y-auto"
    >
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
    </Modal>
  );
}

// Reviews Modal
interface ReviewsModalProps extends BaseModalProps {
  userId: string;
  type: 'buyer' | 'consultant';
  title?: string;
}

export function ReviewsModal({ open, onOpenChange, userId, type, title }: ReviewsModalProps) {
  const { data: reviews, isLoading, error } = useReviews(userId, type);
  const { data: stats } = useRatingStats(userId, type);

  return (
    <DataModal
      open={open}
      onOpenChange={onOpenChange}
      title={title || `${type === 'buyer' ? 'Buyer' : 'Consultant'} Reviews`}
      size="lg"
      loading={isLoading}
      error={error?.message}
      data={reviews}
      emptyMessage="No reviews yet"
    >
      <div className="space-y-4">
        {/* Rating Summary */}
        {stats && stats.totalReviews > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="text-2xl font-bold">{stats.averageRating}</span>
                </div>
                <div className="text-muted-foreground">
                  Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews List */}
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {reviews?.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">
                        {review.reviewer_profile?.full_name || 'Anonymous'}
                      </span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </DataModal>
  );
}