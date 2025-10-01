import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar } from "lucide-react";
import { UpcomingSession } from "@/hooks/useDashboard";

interface UpcomingSessionsProps {
  sessions: UpcomingSession[];
  onClick: () => void;
}

export function UpcomingSessions({ sessions, onClick }: UpcomingSessionsProps) {
  return (
    <Card className="cursor-pointer hover:scale-[1.02] transition-transform" onClick={onClick}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>Upcoming Sessions</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.slice(0, 2).map((booking) => (
            <div key={booking.id} className="p-4 rounded-lg border bg-card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-foreground">{booking.service}</h4>
                  <p className="text-sm text-muted-foreground">with {booking.consultant}</p>
                </div>
                <Badge variant="outline">{booking.duration}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>{booking.date}</span>
                  <span>{booking.time}</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(booking.bookingUrl, '_blank');
                  }}
                >
                  Join Session
                </Button>
              </div>
            </div>
          ))}
          
          {sessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No upcoming sessions</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}