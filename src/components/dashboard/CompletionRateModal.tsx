
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { useState, useMemo } from "react";

interface ServiceCompletion {
  id: string;
  service: string;
  consultant: string;
  date: string;
  status: 'completed' | 'cancelled' | 'pending' | 'confirmed';
  completionRate?: number;
}

interface CompletionRateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: ServiceCompletion[];
  overallRate: number;
}

type StatusFilter = 'all' | 'completed' | 'confirmed' | 'pending' | 'cancelled';

export function CompletionRateModal({ open, onOpenChange, services, overallRate }: CompletionRateModalProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const completed = services.filter(s => s.status === 'completed').length;
  const cancelled = services.filter(s => s.status === 'cancelled').length;
  const pending = services.filter(s => s.status === 'pending').length;
  const confirmed = services.filter(s => s.status === 'confirmed').length;

  const filteredServices = useMemo(() => {
    if (statusFilter === 'all') {
      return services;
    }
    return services.filter(service => service.status === statusFilter);
  }, [services, statusFilter]);

  const handleStatusClick = (status: StatusFilter) => {
    // If clicking the same status, toggle back to 'all'
    if (statusFilter === status) {
      setStatusFilter('all');
    } else {
      setStatusFilter(status);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-success" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-destructive" />;
      case 'pending': return <Clock className="w-5 h-5 text-warning" />;
      case 'confirmed': return <CheckCircle className="w-5 h-5 text-primary" />;
      default: return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Completion Rate Details</DialogTitle>
        </DialogHeader>
        
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <span className="text-2xl font-bold">{overallRate}%</span>
            <span className="text-sm text-muted-foreground">Overall completion rate</span>
          </div>
          <Progress value={overallRate} className="mb-3" />
          
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusClick('completed')}
              className="flex flex-col h-auto py-2"
            >
              <p className="text-lg font-semibold">{completed}</p>
              <p className="text-xs">Completed</p>
            </Button>
            <Button
              variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusClick('confirmed')}
              className="flex flex-col h-auto py-2"
            >
              <p className="text-lg font-semibold">{confirmed}</p>
              <p className="text-xs">Confirmed</p>
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusClick('pending')}
              className="flex flex-col h-auto py-2"
            >
              <p className="text-lg font-semibold">{pending}</p>
              <p className="text-xs">Pending</p>
            </Button>
            <Button
              variant={statusFilter === 'cancelled' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => handleStatusClick('cancelled')}
              className="flex flex-col h-auto py-2"
            >
              <p className="text-lg font-semibold">{cancelled}</p>
              <p className="text-xs">Cancelled</p>
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {statusFilter === 'all' 
              ? `Showing all ${services.length} services`
              : `Showing ${filteredServices.length} ${statusFilter} service${filteredServices.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>

        <ScrollArea className="h-80">
          <div className="space-y-3">
            {filteredServices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No services found for the selected status.
              </div>
            ) : (
              filteredServices.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <p className="font-medium">{service.service}</p>
                      <p className="text-sm text-muted-foreground">with {service.consultant}</p>
                      <p className="text-xs text-muted-foreground">{service.date}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={service.status === 'completed' ? 'default' : 
                            service.status === 'confirmed' ? 'default' :
                            service.status === 'cancelled' ? 'destructive' : 'secondary'}
                  >
                    {service.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
