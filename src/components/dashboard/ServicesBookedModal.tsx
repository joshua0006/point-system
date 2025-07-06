
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, User } from "lucide-react";
import { useState, useMemo } from "react";

interface BookedService {
  id: string;
  service: string;
  consultant: string;
  date: string;
  time?: string;
  duration?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  points: number;
}

interface ServicesBookedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookedServices: BookedService[];
}

type SortOption = 'date-newest' | 'date-oldest' | 'price-highest' | 'price-lowest';
type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

export function ServicesBookedModal({ open, onOpenChange, bookedServices }: ServicesBookedModalProps) {
  const [sortBy, setSortBy] = useState<SortOption>('date-newest');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'confirmed': return 'bg-primary/10 text-primary border-primary/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const filteredAndSortedServices = useMemo(() => {
    // Filter by status
    let filtered = statusFilter === 'all' 
      ? bookedServices 
      : bookedServices.filter(service => service.status === statusFilter);

    // Sort services
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-newest':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-oldest':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'price-highest':
          return b.points - a.points;
        case 'price-lowest':
          return a.points - b.points;
        default:
          return 0;
      }
    });

    return sorted;
  }, [bookedServices, sortBy, statusFilter]);

  const getStatusCount = (status: StatusFilter) => {
    if (status === 'all') return bookedServices.length;
    return bookedServices.filter(service => service.status === status).length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>All Booked Services</DialogTitle>
        </DialogHeader>
        
        <div className="mb-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-2xl font-bold">{bookedServices.length} services booked</p>
          <p className="text-sm text-muted-foreground">
            {bookedServices.filter(s => s.status === 'completed').length} completed
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Sort by:</span>
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-newest">Date (Newest)</SelectItem>
                <SelectItem value="date-oldest">Date (Oldest)</SelectItem>
                <SelectItem value="price-highest">Price (Highest)</SelectItem>
                <SelectItem value="price-lowest">Price (Lowest)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            Showing {filteredAndSortedServices.length} of {bookedServices.length} services
          </div>
        </div>

        {/* Status Tabs */}
        <Tabs value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="text-xs">
              All ({getStatusCount('all')})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs">
              Pending ({getStatusCount('pending')})
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="text-xs">
              Confirmed ({getStatusCount('confirmed')})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">
              Completed ({getStatusCount('completed')})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="text-xs">
              Cancelled ({getStatusCount('cancelled')})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={statusFilter} className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {filteredAndSortedServices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No services found for the selected filters.
                  </div>
                ) : (
                  filteredAndSortedServices.map((service) => (
                    <div key={service.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{service.service}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{service.consultant}</span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(service.status)}>
                          {service.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{service.date}</span>
                          </div>
                          {service.time && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>{service.time}</span>
                            </div>
                          )}
                          {service.duration && (
                            <Badge variant="outline" className="text-xs">{service.duration}</Badge>
                          )}
                        </div>
                        <span className="font-semibold">{service.points} pts</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
