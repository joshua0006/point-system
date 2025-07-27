
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Plus } from "lucide-react";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";

interface Transaction {
  id: string;
  type: "spent" | "earned";
  service?: string;
  consultant?: string;
  points: number;
  date: string;
  status: string;
}

interface BalanceDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTopUp?: () => void;
}

export function BalanceDetailsModal({ open, onOpenChange, onTopUp }: BalanceDetailsModalProps) {
  const { data: transactions, isLoading, error } = useTransactionHistory();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Balance History</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))
            ) : error ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Failed to load transaction history</p>
                <p className="text-sm">Please try again later</p>
              </div>
            ) : !transactions || transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No transactions found</p>
                <p className="text-sm">Your transaction history will appear here</p>
              </div>
            ) : (
              transactions.map((transaction) => (
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
                    <p className="font-medium">{transaction.service}</p>
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
                    {transaction.status}
                  </Badge>
                </div>
              </div>
              ))
            )}
          </div>
        </ScrollArea>
        {onTopUp && (
          <DialogFooter className="pt-4">
            <Button onClick={onTopUp} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Top Up Wallet
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
