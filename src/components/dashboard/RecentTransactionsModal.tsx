import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Transaction } from "@/hooks/useDashboardData";
import { TrendingUp, TrendingDown } from "lucide-react";

interface RecentTransactionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: any[];
}

export function RecentTransactionsModal({ 
  open, 
  onOpenChange, 
  transactions 
}: RecentTransactionsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recent Transactions
          </DialogTitle>
          <DialogDescription>
            Your complete transaction history
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    transaction.amount > 0 
                      ? 'bg-success/10 text-success' 
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    {transaction.amount > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>
                   <div>
                     <p className="font-medium">{transaction.description || 'Transaction'}</p>
                     <p className="text-sm text-muted-foreground">
                       {transaction.created_at ? new Date(transaction.created_at).toLocaleDateString('en-US', {
                         year: 'numeric',
                         month: 'long',
                         day: 'numeric'
                       }) : 'Unknown date'}
                     </p>
                   </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant="default">
                    completed
                  </Badge>
                  <div className={`text-right font-semibold ${
                    transaction.amount > 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount} pts
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}