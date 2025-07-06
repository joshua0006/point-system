
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, User } from "lucide-react";

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

export function ServicesBookedModal({ open, onOpenChange, bookedServices }: ServicesBookedModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'confirmed': return 'bg-primary/10 text-primary border-primary/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>All Booked Services</DialogTitle>
        </DialogHeader>
        <div className="mb-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-2xl font-bold">{bookedServices.length} services booked</p>
          <p className="text-sm text-muted-foreground">
            {bookedServices.filter(s => s.status === 'completed').length} completed
          </p>
        </div>
        <ScrollArea className="h-80">
          <div className="space-y-3">
            {bookedServices.map((service) => (
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
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
