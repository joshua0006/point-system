import { useState } from "react";
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Wallet, 
  CreditCard, 
  History, 
  Calendar,
  Settings,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  Clock
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUpcomingCharges } from "@/hooks/useUpcomingCharges";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { TopUpModal } from "@/components/TopUpModal";
import { SubscriptionStatusCard } from "@/components/SubscriptionStatusCard";
import { TransactionsTable } from "./TransactionsTable";
import { UpcomingChargesTable } from "./UpcomingChargesTable";

interface WalletDrawerProps {
  children: React.ReactNode;
}

export function WalletDrawer({ children }: WalletDrawerProps) {
  const [open, setOpen] = useState(false);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  const { profile } = useAuth();
  const { data: transactions } = useTransactionHistory();
  const { data: upcomingCharges } = useUpcomingCharges();
  
  const currentBalance = profile?.flexi_credits_balance || 0;
  const isNegativeBalance = currentBalance < 0;
  
  // Calculate quick stats
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentTransactions = transactions?.filter(t => 
    new Date(t.date) > last30Days
  ) || [];
  
  const totalSpent30Days = recentTransactions
    .filter(t => t.type === "spent")
    .reduce((sum, t) => sum + Math.abs(t.points), 0);
    
  const totalEarned30Days = recentTransactions
    .filter(t => t.type === "earned")
    .reduce((sum, t) => sum + t.points, 0);

  return (
    <>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {children}
        </DrawerTrigger>
        <DrawerContent className="h-[90vh]">
          <DrawerHeader className="border-b">
            <DrawerTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Wallet & Billing
            </DrawerTitle>
          </DrawerHeader>
          
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-4 mx-6 mt-4">
                <TabsTrigger value="overview" className="flex items-center gap-1">
                  <Wallet className="w-4 h-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="transactions" className="flex items-center gap-1">
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">History</span>
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">Upcoming</span>
                </TabsTrigger>
                <TabsTrigger value="subscription" className="flex items-center gap-1">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Plan</span>
                </TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <TabsContent value="overview" className="space-y-6">
                  {/* Balance Header */}
                  <Card className={`border-l-4 ${isNegativeBalance ? 'border-l-destructive bg-destructive/5' : 'border-l-primary bg-primary/5'}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            Current Balance
                          </p>
                          <div className={`text-3xl font-bold ${isNegativeBalance ? 'text-destructive' : 'text-foreground'}`}>
                            {isNegativeBalance && 'Owes '}
                            {Math.abs(currentBalance).toLocaleString()}
                            <span className="text-lg font-normal text-muted-foreground ml-1">
                              {isNegativeBalance ? ' pts' : ' credits'}
                            </span>
                          </div>
                          {isNegativeBalance && (
                            <p className="text-sm text-destructive mt-1">
                              Action required • Add credits to continue using services
                            </p>
                          )}
                        </div>
                        <Button 
                          onClick={() => setTopUpModalOpen(true)}
                          size="lg"
                          className="flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Credits
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gifting Credits Balance */}
                  {/* Gifting Credits removed - now using flexi credits for reimbursements */}

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Last 30 Days</p>
                            <p className="text-2xl font-bold text-destructive">
                              -{totalSpent30Days.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">Credits spent</p>
                          </div>
                          <TrendingDown className="w-8 h-8 text-destructive" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Last 30 Days</p>
                            <p className="text-2xl font-bold text-success">
                              +{totalEarned30Days.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">Credits earned</p>
                          </div>
                          <TrendingUp className="w-8 h-8 text-success" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Recent Activity</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setActiveTab("transactions")}
                        className="flex items-center gap-1"
                      >
                        View All
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {recentTransactions.slice(0, 5).map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${
                                transaction.type === "earned" ? "bg-success" : "bg-destructive"
                              }`} />
                              <div>
                                <p className="font-medium text-sm">{transaction.service}</p>
                                <p className="text-xs text-muted-foreground">{transaction.date}</p>
                              </div>
                            </div>
                            <div className={`text-sm font-semibold ${
                              transaction.type === "earned" ? "text-success" : "text-destructive"
                            }`}>
                              {transaction.type === "earned" ? "+" : "-"}
                              {Math.abs(transaction.points).toLocaleString()}
                            </div>
                          </div>
                        ))}
                        {recentTransactions.length === 0 && (
                          <p className="text-center text-muted-foreground py-8">
                            No recent transactions
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Upcoming Charges Alert */}
                  {upcomingCharges && upcomingCharges.length > 0 && (
                    <Card className="border-orange-200 bg-orange-50/50">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-orange-800">
                              {upcomingCharges.length} Upcoming Charge{upcomingCharges.length > 1 ? 's' : ''}
                            </p>
                            <p className="text-sm text-orange-600">
                              Next charge: {upcomingCharges[0].due_date}
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setActiveTab("upcoming")}
                            className="border-orange-300 text-orange-700 hover:bg-orange-100"
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="transactions">
                  <TransactionsTable transactions={transactions || []} />
                </TabsContent>
                
                <TabsContent value="upcoming">
                  <UpcomingChargesTable charges={upcomingCharges || []} />
                </TabsContent>
                
                <TabsContent value="subscription" className="space-y-4">
                  <div className="bg-muted/30 p-4 rounded-lg border">
                    <h4 className="font-medium text-sm mb-2">💡 How to Change Your Plan</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      • Click "Change Plan" to upgrade or downgrade your subscription
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      • Use "Manage Billing" to update payment methods and view invoices
                    </p>
                    <p className="text-xs text-muted-foreground">
                      All changes go through Stripe's secure checkout for your protection
                    </p>
                  </div>
                  <SubscriptionStatusCard showActions={true} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </DrawerContent>
      </Drawer>
      
      <TopUpModal 
        isOpen={topUpModalOpen}
        onClose={() => setTopUpModalOpen(false)}
      />
    </>
  );
}