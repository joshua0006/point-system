import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Transaction } from "@/hooks/useDashboard";
import { TrendingUp, TrendingDown } from '@/lib/icons';

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
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto p-3 sm:p-6 rounded-lg sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg font-semibold min-w-0 overflow-hidden">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="truncate block min-w-0">Recent Transactions</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Your complete transaction history
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2 sm:space-y-3 py-2 sm:py-0 overflow-hidden">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`relative flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 md:gap-3 p-2 sm:p-2.5 md:p-4 rounded-lg transition-all duration-200 hover:shadow-md border-l-4 overflow-hidden ${
                  transaction.type === 'earned'
                    ? 'bg-green-50/50 hover:bg-green-50 border-green-500 dark:bg-green-950/20 dark:hover:bg-green-950/30'
                    : 'bg-red-50/50 hover:bg-red-50 border-red-500 dark:bg-red-950/20 dark:hover:bg-red-950/30'
                }`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-1 min-w-0 overflow-hidden">
                  <div
                    className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0 ${
                      transaction.type === 'earned'
                        ? 'bg-green-100 dark:bg-green-900/40'
                        : 'bg-red-100 dark:bg-red-900/40'
                    }`}
                  >
                    {transaction.type === 'earned' ? (
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-700 dark:text-green-300" />
                    ) : (
                      <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-700 dark:text-red-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="font-medium text-xs sm:text-sm truncate">{transaction.service || 'Transaction'}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {transaction.date || 'Unknown date'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 justify-between sm:justify-end flex-shrink-0">
                  <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 max-w-[80px] truncate">
                    completed
                  </Badge>
                  <div
                    className={`font-bold text-xs sm:text-sm rounded-full px-2 sm:px-2.5 py-1 sm:py-1.5 flex items-center gap-0.5 sm:gap-1 max-w-[100px] sm:max-w-[120px] ${
                      transaction.type === 'earned'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                    }`}
                  >
                    <span className="text-[10px] sm:text-xs flex-shrink-0">{transaction.type === 'earned' ? '↑' : '↓'}</span>
                    <span className="text-xs sm:text-sm truncate">{transaction.type === 'earned' ? '+' : '-'}{transaction.points} pts</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-8 sm:py-12">
              <div className="p-3 sm:p-4 bg-muted/50 rounded-full mb-3 sm:mb-4">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1 sm:mb-2">No Transactions Yet</h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
                Your transaction history will appear here once you start using credits
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}