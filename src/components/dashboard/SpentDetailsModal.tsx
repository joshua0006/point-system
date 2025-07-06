
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingBag } from "lucide-react";

interface SpentTransaction {
  id: string;
  service: string;
  consultant: string;
  points: number;
  date: string;
  status: string;
  duration?: string;
}

interface SpentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spentTransactions: SpentTransaction[];
}

export function SpentDetailsModal({ open, onOpenChange, spentTransactions }: SpentDetailsModalProps) {
  const totalSpent = spentTransactions.reduce((sum, t) => sum + t.points, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Services Purchased</DialogTitle>
        </DialogHeader>
        <div className="mb-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-2xl font-bold text-destructive">{totalSpent.toLocaleString()} points spent</p>
          <p className="text-sm text-muted-foreground">{spentTransactions.length} services purchased</p>
        </div>
        <ScrollArea className="h-80">
          <div className="space-y-3">
            {spentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">{transaction.service}</p>
                    <p className="text-sm text-muted-foreground">with {transaction.consultant}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">{transaction.date}</p>
                      {transaction.duration && (
                        <Badge variant="secondary" className="text-xs">{transaction.duration}</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-destructive">-{transaction.points}</p>
                  <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
