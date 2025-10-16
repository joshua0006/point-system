import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, Receipt } from "lucide-react";
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

  const netBalance = totalEarned - totalSpent;
  const transactionCount = transactions.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Net Balance</p>
              <p className={`text-2xl font-bold ${
                netBalance >= 0 ? "text-success" : "text-destructive"
              }`}>
                {netBalance >= 0 ? "+" : ""}{netBalance.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Balance change</p>
            </div>
            <Activity className={`w-8 h-8 ${
              netBalance >= 0 ? "text-success" : "text-destructive"
            }`} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Transactions</p>
              <p className="text-2xl font-bold text-foreground">
                {transactionCount.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total count</p>
            </div>
            <Receipt className="w-8 h-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
