import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BookedService } from "@/hooks/useDashboardData";
import { Users, Calendar, Clock } from "lucide-react";

interface RecentBookingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookings: any[];
}

export function RecentBookingsModal({ 
  open, 
  onOpenChange, 
  bookings 
}: RecentBookingsModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Recent Bookings
          </DialogTitle>
          <DialogDescription>
            Your complete booking history
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {bookings.length > 0 ? (
            bookings.map((booking) => (
              <div 
                key={booking.id} 
                className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    <Users className="w-4 h-4" />
                  </div>
                   <div>
                     <p className="font-medium">{booking.service || 'Service'}</p>
                     <p className="text-sm text-muted-foreground">
                       with {booking.consultant || 'Professional Consultant'}
                     </p>
                     <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {booking.date || 'Unknown date'}
                        </div>
                      {/* Commenting out time and duration for demo data */}
                      {/* {booking.time && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {booking.time}
                        </div>
                      )}
                      {booking.duration && (
                        <span>{booking.duration}</span>
                      )} */}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant={getStatusColor(booking.status)}>
                    {booking.status}
                  </Badge>
                  <div className="text-right">
                    <div className="font-semibold">{booking.points} pts</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No bookings found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}