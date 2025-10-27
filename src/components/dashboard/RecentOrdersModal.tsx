
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, DollarSign, Clock, User } from '@/lib/icons';
import { useState } from "react";

interface RecentOrdersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: any[];
}

type SortOption = "date-newest" | "date-oldest" | "price-highest" | "price-lowest";

const mockOrders = [
  {
    id: "1",
    service: "Strategic Business Consultation",
    client: "John D.",
    date: "2024-01-20",
    time: "2:00 PM",
    points: 500,
    status: "completed",
    duration: "1 hour"
  },
  {
    id: "2",
    service: "Growth Strategy Workshop",
    client: "Maria S.",
    date: "2024-01-18",
    time: "10:00 AM",
    points: 350,
    status: "confirmed",
    duration: "45 mins"
  },
  {
    id: "3",
    service: "Financial Planning Session",
    client: "David K.",
    date: "2024-01-15",
    time: "3:00 PM",
    points: 400,
    status: "completed",
    duration: "1 hour"
  },
  {
    id: "4",
    service: "Marketing Strategy Review",
    client: "Sarah L.",
    date: "2024-01-12",
    time: "11:00 AM",
    points: 300,
    status: "completed",
    duration: "30 mins"
  },
  {
    id: "5",
    service: "Technical Architecture Audit",
    client: "Robert M.",
    date: "2024-01-10",
    time: "4:00 PM",
    points: 600,
    status: "completed",
    duration: "1.5 hours"
  },
];

export function RecentOrdersModal({ open, onOpenChange }: RecentOrdersModalProps) {
  const [sortBy, setSortBy] = useState<SortOption>("date-newest");
  
  const sortedOrders = [...mockOrders].sort((a, b) => {
    switch (sortBy) {
      case "date-newest":
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case "date-oldest":
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case "price-highest":
        return b.points - a.points;
      case "price-lowest":
        return a.points - b.points;
      default:
        return 0;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "confirmed":
        return "secondary";
      case "pending":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Recent Orders</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filter Section */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">All Orders ({sortedOrders.length})</h3>
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-newest">Date (Newest)</SelectItem>
                <SelectItem value="date-oldest">Date (Oldest)</SelectItem>
                <SelectItem value="price-highest">Price (Highest)</SelectItem>
                <SelectItem value="price-lowest">Price (Lowest)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {sortedOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-2">{order.service}</h4>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>with {order.client}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{order.date}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{order.time}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(order.status)} className="capitalize">
                      {order.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{order.duration}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 font-semibold text-primary">
                      <DollarSign className="w-4 h-4" />
                      <span>{order.points} points</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
