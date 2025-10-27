import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from '@/lib/icons';
import { TransactionHistoryItem } from "@/hooks/useTransactionHistory";

interface TransactionSummaryCardsProps {
  transactions: TransactionHistoryItem[];
}

export function TransactionSummaryCards({ transactions }: TransactionSummaryCardsProps) {
  const totalSpent = transactions
    .filter(t => t.type === "spent")
    .reduce((sum, t) => sum + Math.abs(t.points), 0);

  const totalEarned = transactions
    .filter(t => t.type === "earned")
    .reduce((sum, t) => sum + t.points, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold text-destructive">
                -{totalSpent.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Credits used</p>
            </div>
            <TrendingDown className="w-8 h-8 text-destructive" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Earned</p>
              <p className="text-2xl font-bold text-success">
                +{totalEarned.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Credits received</p>
            </div>
            <TrendingUp className="w-8 h-8 text-success" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
