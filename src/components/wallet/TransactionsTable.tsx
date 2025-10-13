import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Download,
  Filter,
  ArrowUpDown,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { TransactionHistoryItem } from "@/hooks/useTransactionHistory";
import { useIsMobile } from "@/hooks/use-mobile";

interface TransactionsTableProps {
  transactions: TransactionHistoryItem[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.consultant?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(transaction => transaction.type === typeFilter);
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [transactions, searchTerm, typeFilter, sortOrder]);
  
  const exportToCSV = () => {
    const csvContent = [
      ["Date", "Type", "Service", "Consultant", "Points", "Status"].join(","),
      ...filteredAndSortedTransactions.map(transaction => [
        transaction.date,
        transaction.type,
        transaction.service,
        transaction.consultant || "N/A",
        transaction.points,
        transaction.status
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  const totalSpent = transactions
    .filter(t => t.type === "spent")
    .reduce((sum, t) => sum + Math.abs(t.points), 0);
    
  const totalEarned = transactions
    .filter(t => t.type === "earned")
    .reduce((sum, t) => sum + t.points, 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-destructive">
                  -{totalSpent.toLocaleString()}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold text-success">
                  +{totalEarned.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className={isMobile ? "text-base" : ""}>Transaction History</span>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="flex items-center gap-2"
              aria-label="Export transactions to CSV"
            >
              <Download className="w-4 h-4" />
              {!isMobile && <span>Export CSV</span>}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className={isMobile ? "w-full" : "w-[150px]"}>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="earned">Earned</SelectItem>
                <SelectItem value="spent">Spent</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className={`flex items-center gap-2 ${isMobile ? "w-full" : ""}`}
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortOrder === "desc" ? "Newest" : "Oldest"}
            </Button>
          </div>
          
          {/* Desktop Table View */}
          {!isMobile ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Consultant</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedTransactions.length > 0 ? (
                    filteredAndSortedTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {new Date(transaction.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={transaction.type === "earned" ? "default" : "secondary"}
                            className={transaction.type === "earned" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}
                          >
                            {transaction.type === "earned" ? "Earned" : "Spent"}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.service}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {transaction.consultant || "N/A"}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${
                          transaction.type === "earned" ? "text-success" : "text-destructive"
                        }`}>
                          {transaction.type === "earned" ? "+" : "-"}
                          {Math.abs(transaction.points).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={transaction.status === "completed" ? "default" : "secondary"}
                          >
                            {transaction.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchTerm || typeFilter !== "all"
                          ? "No transactions match your filters"
                          : "No transactions found"
                        }
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            /* Mobile Card View */
            <div className="space-y-3">
              {filteredAndSortedTransactions.length > 0 ? (
                filteredAndSortedTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={transaction.type === "earned" ? "default" : "secondary"}
                          className={transaction.type === "earned" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}
                        >
                          {transaction.type === "earned" ? "Earned" : "Spent"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-medium text-sm">{transaction.service}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {transaction.consultant && (
                          <>
                            <span>{transaction.consultant}</span>
                            <span>•</span>
                          </>
                        )}
                        <Badge
                          variant={transaction.status === "completed" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`font-bold text-lg ${
                        transaction.type === "earned" ? "text-success" : "text-destructive"
                      }`}>
                        {transaction.type === "earned" ? "+" : "-"}
                        {Math.abs(transaction.points).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm || typeFilter !== "all"
                    ? "No transactions match your filters"
                    : "No transactions found"
                  }
                </div>
              )}
            </div>
          )}
          
          {filteredAndSortedTransactions.length > 0 && (
            <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
              <span>
                Showing {filteredAndSortedTransactions.length} of {transactions.length} transactions
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}