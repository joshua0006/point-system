import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  CreditCard, 
  DollarSign, 
  Activity,
  Plus,
  Minus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  points_balance: number;
  role: string;
  created_at: string;
}

interface UserSubscription {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
  credits_per_month?: number;
  stripe_customer_id?: string;
}

interface UserTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

interface BillingProfileModalProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BillingProfileModal({ user, open, onOpenChange }: BillingProfileModalProps) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'deduct'>('add');
  const { toast } = useToast();

  useEffect(() => {
    if (open && user) {
      fetchUserBillingData();
    }
  }, [open, user]);

  const fetchUserBillingData = async () => {
    setLoading(true);
    try {
      // Fetch subscription info
      const { data: subData } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', user.user_id)
        .single();
      
      setSubscription(subData);

      // Fetch recent transactions
      const { data: transData } = await supabase
        .from('flexi_credits_transactions')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false })
        .limit(20);

      setTransactions(transData || []);
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreditAdjustment = async () => {
    const amount = parseFloat(adjustmentAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    if (!adjustmentReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for the adjustment.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: adjustmentType === 'add' ? 'topup_points' : 'deduct_points',
          userId: user.user_id,
          points: amount,
          reason: adjustmentReason.trim()
        }
      });

      if (error) throw error;

      toast({
        title: "Adjustment Complete",
        description: `Successfully ${adjustmentType === 'add' ? 'added' : 'deducted'} ${amount} points.`,
      });

      setAdjustmentAmount("");
      setAdjustmentReason("");
      fetchUserBillingData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to adjust credits.",
        variant: "destructive",
      });
    }
  };

  const earnedTransactions = transactions.filter(t => t.amount > 0);
  const spentTransactions = transactions.filter(t => t.amount < 0);
  const totalEarned = earnedTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = Math.abs(spentTransactions.reduce((sum, t) => sum + t.amount, 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Billing Profile: {user.full_name || user.email}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">User Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-bold text-accent">
                    {user.points_balance.toLocaleString()} pts
                  </div>
                  <p className="text-xs text-muted-foreground">Current Balance</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-success">
                    +{totalEarned.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Total Earned</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-destructive">
                    -{totalSpent.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {transactions.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Info */}
          {subscription && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4" />
                  Subscription Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Badge variant={subscription.subscribed ? 'default' : 'secondary'}>
                      {subscription.subscribed ? 'Active' : 'Inactive'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">Status</p>
                  </div>
                  {subscription.subscription_tier && (
                    <div>
                      <div className="font-medium">{subscription.subscription_tier}</div>
                      <p className="text-xs text-muted-foreground">Plan</p>
                    </div>
                  )}
                  {subscription.credits_per_month && (
                    <div>
                      <div className="font-medium">{subscription.credits_per_month} pts/month</div>
                      <p className="text-xs text-muted-foreground">Monthly Credits</p>
                    </div>
                  )}
                  {subscription.subscription_end && (
                    <div>
                      <div className="font-medium">
                        {new Date(subscription.subscription_end).toLocaleDateString()}
                      </div>
                      <p className="text-xs text-muted-foreground">Expires</p>
                    </div>
                  )}
                </div>
                {subscription.stripe_customer_id && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Stripe Customer ID: {subscription.stripe_customer_id}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Credit Adjustment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4" />
                Credit Adjustment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant={adjustmentType === 'add' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAdjustmentType('add')}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Points
                    </Button>
                    <Button
                      variant={adjustmentType === 'deduct' ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => setAdjustmentType('deduct')}
                    >
                      <Minus className="w-4 h-4 mr-1" />
                      Deduct Points
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount</label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(e.target.value)}
                      min="0.1"
                      step="0.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reason *</label>
                    <Textarea
                      placeholder="Explain the reason for this adjustment..."
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                  {adjustmentType === 'deduct' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-yellow-800 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium">Warning</span>
                      </div>
                      <p className="text-yellow-700 text-sm mt-1">
                        This will permanently remove points from the user's account.
                      </p>
                    </div>
                  )}
                  <Button 
                    onClick={handleCreditAdjustment}
                    disabled={!adjustmentAmount || !adjustmentReason.trim()}
                    variant={adjustmentType === 'deduct' ? 'destructive' : 'default'}
                    className="w-full"
                  >
                    {adjustmentType === 'add' ? 'Add' : 'Deduct'} {adjustmentAmount || 0} Points
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Activity className="w-4 h-4" />
                  Recent Transactions ({transactions.length})
                </CardTitle>
                <Button onClick={fetchUserBillingData} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No transactions found</div>
              ) : (
                <div className="overflow-x-auto max-h-60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="text-sm">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={transaction.amount > 0 ? 'default' : 'secondary'} className="gap-1">
                              {transaction.amount > 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {transaction.amount > 0 ? 'earned' : 'spent'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className={`font-medium ${
                              transaction.amount > 0 ? 'text-success' : 'text-destructive'
                            }`}>
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} pts
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {transaction.description}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}