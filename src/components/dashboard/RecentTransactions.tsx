import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, TrendingUp } from "lucide-react";
import { Transaction } from "@/hooks/useDashboardData";

interface RecentTransactionsProps {
  transactions: Transaction[];
  onClick: () => void;
}

export function RecentTransactions({ transactions, onClick }: RecentTransactionsProps) {
  return (
    <Card className="cursor-pointer hover:scale-[1.02] transition-transform" onClick={onClick}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ArrowUpDown className="w-5 h-5" />
          <span>Recent Transactions</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  transaction.type === 'spent' 
                    ? 'bg-destructive/10 text-destructive' 
                    : 'bg-success/10 text-success'
                }`}>
                  {transaction.type === 'spent' ? (
                    <TrendingUp className="w-4 h-4 rotate-45" />
                  ) : (
                    <TrendingUp className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">{transaction.service}</p>
                  {transaction.consultant && (
                    <p className="text-xs text-muted-foreground">with {transaction.consultant}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{transaction.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${
                  transaction.type === 'spent' ? 'text-destructive' : 'text-success'
                }`}>
                  {transaction.type === 'spent' ? '-' : '+'}{transaction.points}
                </p>
                <Badge variant="outline" className="text-xs">
                  {transaction.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}