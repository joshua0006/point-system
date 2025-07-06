
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface ServiceCompletion {
  id: string;
  service: string;
  consultant: string;
  date: string;
  status: 'completed' | 'cancelled' | 'pending';
  completionRate?: number;
}

interface CompletionRateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: ServiceCompletion[];
  overallRate: number;
}

export function CompletionRateModal({ open, onOpenChange, services, overallRate }: CompletionRateModalProps) {
  const completed = services.filter(s => s.status === 'completed').length;
  const cancelled = services.filter(s => s.status === 'cancelled').length;
  const pending = services.filter(s => s.status === 'pending').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-success" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-destructive" />;
      case 'pending': return <Clock className="w-5 h-5 text-warning" />;
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
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-semibold text-success">{completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-warning">{pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-destructive">{cancelled}</p>
              <p className="text-xs text-muted-foreground">Cancelled</p>
            </div>
          </div>
        </div>

        <ScrollArea className="h-80">
          <div className="space-y-3">
            {services.map((service) => (
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
                          service.status === 'cancelled' ? 'destructive' : 'secondary'}
                >
                  {service.status}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
