
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, Plus } from "lucide-react";

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
  transactions: Transaction[];
  onTopUp?: () => void;
}

export function BalanceDetailsModal({ open, onOpenChange, transactions, onTopUp }: BalanceDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Balance History</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {transactions.map((transaction) => (
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
            ))}
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
