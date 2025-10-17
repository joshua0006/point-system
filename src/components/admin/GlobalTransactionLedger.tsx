import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGlobalTransactions } from "@/hooks/useAdminBilling";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar,
  User
} from "lucide-react";

export function GlobalTransactionLedger() {
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    type: 'all',
    userId: '',
    search: ''
  });

  const { data: transactions, isLoading, error, refetch } = useGlobalTransactions({
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    type: filters.type !== 'all' ? filters.type : undefined,
    userId: filters.userId || undefined,
  });

  const { toast } = useToast();

  const filteredTransactions = transactions?.filter(t => {
    if (!filters.search) return true;
    const searchTerm = filters.search.toLowerCase();
    return (
      t.user_email.toLowerCase().includes(searchTerm) ||
      t.user_name.toLowerCase().includes(searchTerm) ||
      t.description.toLowerCase().includes(searchTerm) ||
      (t.service_title && t.service_title.toLowerCase().includes(searchTerm)) ||
      (t.consultant_name && t.consultant_name.toLowerCase().includes(searchTerm))
    );
  }) || [];

  const handleExport = () => {
    if (!filteredTransactions.length) {
      toast({
        title: "No Data",
        description: "No transactions to export.",
        variant: "destructive",
      });
      return;
    }

    const csvContent = [
      ['Date', 'User', 'Email', 'Type', 'Amount', 'Description', 'Service', 'Consultant'].join(','),
      ...filteredTransactions.map(t => [
        new Date(t.created_at).toLocaleDateString(),
        t.user_name,
        t.user_email,
        t.type,
        t.amount,
        `"${t.description}"`,
        t.service_title || '',
        t.consultant_name || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Transaction data has been exported to CSV.",
    });
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      type: 'all',
      userId: '',
      search: ''
    });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            Failed to load transactions. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Transaction Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="earned">Earned</SelectItem>
                  <SelectItem value="spent">Spent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">User ID</label>
              <Input
                placeholder="Enter user ID"
                value={filters.userId}
                onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <label className="text-sm font-medium">Actions</label>
              <div className="flex gap-2">
                <Button onClick={clearFilters} variant="outline" size="sm" className="flex-1 sm:flex-none">
                  Clear
                </Button>
                <Button onClick={() => refetch()} variant="outline" size="sm" className="px-3">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex flex-wrap items-center gap-2">
              <Calendar className="w-5 h-5 shrink-0" />
              <span className="truncate">Global Transaction Ledger</span>
              {filteredTransactions.length > 0 && (
                <Badge variant="secondary" className="shrink-0">
                  {filteredTransactions.length} transactions
                </Badge>
              )}
            </CardTitle>
            <Button onClick={handleExport} variant="outline" size="sm" disabled={!filteredTransactions.length} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading transactions...</div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px]">Date</TableHead>
                    <TableHead className="min-w-[180px]">User</TableHead>
                    <TableHead className="min-w-[100px]">Type</TableHead>
                    <TableHead className="min-w-[100px]">Amount</TableHead>
                    <TableHead className="min-w-[200px]">Description</TableHead>
                    <TableHead className="min-w-[150px]">Service/Consultant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="text-sm whitespace-nowrap">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(transaction.created_at).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                          <Avatar className="w-7 h-7 sm:w-8 sm:h-8 shrink-0">
                            <AvatarFallback>
                              {transaction.user_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">
                              {transaction.user_name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {transaction.user_email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'earned' ? 'default' : 'secondary'} className="gap-1">
                          {transaction.type === 'earned' ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium whitespace-nowrap ${
                          transaction.type === 'earned' ? 'text-success' : 'text-destructive'
                        }`}>
                          {transaction.type === 'earned' ? '+' : '-'}{transaction.amount.toLocaleString()} pts
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm max-w-[250px] break-words">
                          {transaction.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.service_title && (
                          <div className="text-sm min-w-0">
                            <div className="font-medium truncate">{transaction.service_title}</div>
                            {transaction.consultant_name && (
                              <div className="text-xs text-muted-foreground truncate">
                                with {transaction.consultant_name}
                              </div>
                            )}
                          </div>
                        )}
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
  );
}