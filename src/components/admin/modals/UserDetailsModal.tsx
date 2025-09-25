import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { 
  User, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Receipt,
  X
} from "lucide-react";
import { format } from "date-fns";
import type { UserProfile } from "@/config/types";

interface UserDetailsModalProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
  booking_id?: string;
}

export function UserDetailsModal({ user, open, onOpenChange }: UserDetailsModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { fetchUserSubscription, getSubscription, isLoading: subscriptionLoading } = useUserSubscription();

  useEffect(() => {
    if (user && open) {
      fetchTransactions();
      fetchUserSubscription(user.user_id, user.email);
    }
  }, [user, open]);

  const fetchTransactions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('flexi_credits_transactions')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch user transactions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const subscription = getSubscription(user.user_id);
  const totalCreditsEarned = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalCreditsSpent = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'subscription':
      case 'admin_credit':
        return 'text-green-600';
      case 'booking':
      case 'service':
      case 'refund':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTransactionIcon = (type: string, amount: number) => {
    if (amount > 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback>
                  {(user.full_name || user.email).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl">
                  {user.full_name || "No name"}
                </DialogTitle>
                <DialogDescription>
                  {user.email}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">
                    {(user.flexi_credits_balance || 0).toLocaleString()} credits
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {totalCreditsEarned.toLocaleString()} credits
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {totalCreditsSpent.toLocaleString()} credits
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Account Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role</span>
                    <Badge variant={
                      user.role === 'master_admin' ? 'destructive' :
                      user.role === 'admin' ? 'destructive' :
                      user.role === 'consultant' ? 'default' : 'secondary'
                    }>
                      {user.role === 'master_admin' ? 'Master Admin' : user.role}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={
                      user.approval_status === 'approved' ? 'default' :
                      user.approval_status === 'pending' ? 'secondary' : 'destructive'
                    }>
                      {user.approval_status || 'approved'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member Since</span>
                    <span>{format(new Date(user.created_at), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span>{format(new Date(user.updated_at), 'MMM dd, yyyy')}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-muted-foreground">Loading...</div>
                  ) : transactions.length > 0 ? (
                    <div className="space-y-2">
                      {transactions.slice(0, 5).map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(transaction.type, transaction.amount)}
                            <span className="truncate max-w-[150px]">
                              {transaction.description}
                            </span>
                          </div>
                          <span className={`font-medium ${getTransactionTypeColor(transaction.type)}`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">No transactions found</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
                ) : transactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTransactionIcon(transaction.type, transaction.amount)}
                              <span className="capitalize">{transaction.type.replace('_', ' ')}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            {transaction.description}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${getTransactionTypeColor(transaction.type)}`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount} credits
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No transactions found</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Subscription Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subscriptionLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading subscription...</div>
                ) : subscription ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <div className="text-lg font-semibold">
                          <Badge variant={subscription.isActive ? 'default' : 'secondary'}>
                            {subscription.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Plan</label>
                        <div className="text-lg font-semibold">{subscription.planName || 'No Plan'}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Tier</label>
                        <div className="text-lg font-semibold capitalize">{subscription.subscriptionTier}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Monthly Credits</label>
                        <div className="text-lg font-semibold text-accent">
                          {subscription.creditsPerMonth?.toLocaleString() || 0} credits
                        </div>
                      </div>
                    </div>
                    {subscription.endDate && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Next Billing</label>
                        <div className="text-lg font-semibold">
                          {format(new Date(subscription.endDate), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No active subscription</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}