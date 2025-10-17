import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Receipt,
  Calendar,
  ChevronLeft,
  ChevronRight
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
  const [dateRange, setDateRange] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
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

    // Apply date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const cutoffDate = new Date();

      switch (dateRange) {
        case "7days":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "30days":
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case "90days":
          cutoffDate.setDate(now.getDate() - 90);
          break;
      }

      filtered = filtered.filter(transaction =>
        new Date(transaction.date) >= cutoffDate
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [transactions, searchTerm, typeFilter, dateRange, sortOrder]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedTransactions.slice(startIndex, endIndex);
  }, [filteredAndSortedTransactions, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, dateRange]);
  
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
  
  return (
    <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={isMobile ? "text-base" : ""}>Transaction History</CardTitle>
              <CardDescription className={isMobile ? "text-xs" : ""}>
                View and manage all your credit transactions
              </CardDescription>
            </div>
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by service or consultant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className={`h-10 ${isMobile ? "w-full" : "w-[140px] lg:w-[160px]"}`}>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="earned">Earned</SelectItem>
                  <SelectItem value="spent">Spent</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className={`h-10 ${isMobile ? "w-full" : "w-[160px] lg:w-[180px]"}`}>
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                className={`h-10 items-center gap-2 whitespace-nowrap min-w-fit ${isMobile ? "w-full" : ""}`}
              >
                <ArrowUpDown className="w-4 h-4" />
                {sortOrder === "desc" ? "Newest First" : "Oldest First"}
              </Button>

              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className={`h-10 ${isMobile ? "w-full" : "w-[140px] lg:w-[160px]"}`}>
                  <SelectValue placeholder="Per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Empty State */}
          {filteredAndSortedTransactions.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                {searchTerm || typeFilter !== "all" || dateRange !== "all"
                  ? "No Transactions Found"
                  : "No Transaction History"}
              </h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                {searchTerm || typeFilter !== "all" || dateRange !== "all"
                  ? "Try adjusting your search or filter criteria to find what you're looking for."
                  : "Your transaction history will appear here once you start earning or spending credits."}
              </p>
            </div>
          )}

          {/* Desktop Table View */}
          {!isMobile && filteredAndSortedTransactions.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
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
                  {paginatedTransactions.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
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
                      <TableCell className="max-w-[200px] truncate" title={transaction.service}>{transaction.service}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[150px] truncate" title={transaction.consultant || "N/A"}>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Mobile Card View */}
          {isMobile && filteredAndSortedTransactions.length > 0 && (
            <div className="space-y-3">
              {paginatedTransactions.map((transaction) => (
                <Card
                  key={transaction.id}
                  className={`lg:border-l-4 ${
                    transaction.type === "earned"
                      ? "lg:border-l-success lg:bg-success/5"
                      : "lg:border-l-destructive lg:bg-destructive/5"
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
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
                      <p className={`font-bold text-lg whitespace-nowrap ${
                        transaction.type === "earned" ? "text-success" : "text-destructive"
                      }`}>
                        {transaction.type === "earned" ? "+" : "-"}
                        {Math.abs(transaction.points).toLocaleString()}
                      </p>
                    </div>

                    {/* Service Name */}
                    <p className="font-semibold text-sm truncate" title={transaction.service}>{transaction.service}</p>

                    {/* Footer Row */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      {transaction.consultant && (
                        <>
                          <span className="truncate min-w-0 max-w-[180px]" title={transaction.consultant}>{transaction.consultant}</span>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredAndSortedTransactions.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedTransactions.length)} of {filteredAndSortedTransactions.length} transactions
                {filteredAndSortedTransactions.length !== transactions.length && (
                  <span className="ml-1">
                    (filtered from {transactions.length} total)
                  </span>
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {!isMobile && <span>Previous</span>}
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-9 h-9 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1"
                  >
                    {!isMobile && <span>Next</span>}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
  );
}