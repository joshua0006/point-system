import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, CreditCard, Wallet, Calendar, Receipt } from '@/lib/icons';
import { format } from "date-fns";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
  booking_id: string | null;
}

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionHistoryModal = ({ isOpen, onClose }: TransactionHistoryModalProps) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);

  useEffect(() => {
    if (isOpen && user) {
      fetchTransactions();
    }
  }, [isOpen, user]);

  const fetchTransactions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('flexi_credits_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
      
      // Calculate totals
      const spent = data?.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
      const earned = data?.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0) || 0;
      
      setTotalSpent(spent);
      setTotalEarned(earned);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string, amount: number) => {
    if (amount > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'Purchase';
      case 'refund':
        return 'Refund';
      case 'admin_credit':
        return 'Admin Credit';
      case 'initial_credit':
        return 'Initial Credit';
      case 'earning':
        return 'Earning';
      default:
        return type;
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (amount > 0) {
      return 'bg-green-50 text-green-700 border-green-200';
    } else {
      return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Transaction History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-hidden">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border border-green-200 bg-green-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Total Earned</p>
                    <p className="text-2xl font-bold text-green-700">
                      +{totalEarned.toLocaleString()}
                    </p>
                  </div>
                  <Wallet className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-red-200 bg-red-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-700">Total Spent</p>
                    <p className="text-2xl font-bold text-red-700">
                      -{totalSpent.toLocaleString()}
                    </p>
                  </div>
                  <CreditCard className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Transaction List */}
          <div className="min-h-0 flex-1">
            <h3 className="text-lg font-semibold mb-3">Recent Transactions</h3>
            <ScrollArea className="h-[300px] pr-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Transactions Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Your transaction history will appear here once you start making purchases.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <Card key={transaction.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="mt-1">
                              {getTransactionIcon(transaction.type, transaction.amount)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate">
                                {transaction.description || getTransactionTypeLabel(transaction.type)}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">
                                  {format(new Date(transaction.created_at), 'MMM d, yyyy h:mm a')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge 
                              variant="secondary"
                              className={`text-xs ${getTransactionColor(transaction.type, transaction.amount)}`}
                            >
                              {getTransactionTypeLabel(transaction.type)}
                            </Badge>
                            <div className={`text-sm font-bold whitespace-nowrap ${
                              transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t mt-4">
            <Button onClick={onClose} className="px-6">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};