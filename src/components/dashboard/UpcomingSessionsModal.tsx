
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, ExternalLink } from "lucide-react";

interface UpcomingSession {
  id: string;
  service: string;
  consultant: string;
  date: string;
  time: string;
  duration: string;
  bookingUrl: string;
  status?: 'confirmed' | 'pending';
}

interface UpcomingSessionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: UpcomingSession[];
}

export function UpcomingSessionsModal({ open, onOpenChange, sessions }: UpcomingSessionsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>All Upcoming Sessions</DialogTitle>
        </DialogHeader>
        
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No upcoming sessions</p>
          </div>
        ) : (
          <>
            <div className="mb-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{sessions.length} upcoming sessions</p>
              <p className="text-sm text-muted-foreground">Next session on {sessions[0]?.date}</p>
            </div>
            
            <ScrollArea className="h-80">
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{session.service}</h4>
                        <p className="text-sm text-muted-foreground">with {session.consultant}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{session.duration}</Badge>
                        {session.status && (
                          <Badge variant={session.status === 'confirmed' ? 'default' : 'secondary'}>
                            {session.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{session.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{session.time}</span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(session.bookingUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Join Session
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
