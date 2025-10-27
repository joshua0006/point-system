import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Monitor, 
  MessageSquare, 
  FileText, 
  Calendar,
  ArrowLeft,
  Users,
  Clock,
  Star
} from '@/lib/icons';
import { useState } from 'react';

interface BookingDetails {
  id: string;
  serviceTitle: string;
  consultantName: string;
  consultantTier: string;
  price: number;
  duration?: number;
  description: string;
}

interface MockSessionInterfaceProps {
  bookingDetails: BookingDetails;
  onBack: () => void;
}

export function MockSessionInterface({ bookingDetails, onBack }: MockSessionInterfaceProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Booking Details
        </Button>
        <Badge variant="secondary" className="bg-success/10 text-success">
          Demo Session
        </Badge>
      </div>

      {/* Video Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Video Area */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="overflow-hidden">
            <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-primary-glow/10 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Avatar className="w-20 h-20 mx-auto">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {bookingDetails.consultantName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{bookingDetails.consultantName}</h3>
                  <p className="text-muted-foreground capitalize">{bookingDetails.consultantTier} Consultant</p>
                </div>
              </div>
              
              {/* Video Controls Overlay */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
                <Button
                  size="sm"
                  variant={isMuted ? "destructive" : "secondary"}
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant={isVideoOff ? "destructive" : "secondary"}
                  onClick={() => setIsVideoOff(!isVideoOff)}
                >
                  {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="secondary">
                  <Monitor className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Session Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{bookingDetails.serviceTitle}</span>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{bookingDetails.duration || 60} min session</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{bookingDetails.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">1-on-1 Session</p>
                  <p className="text-xs text-muted-foreground">Private consultation</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <FileText className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Session Notes</p>
                  <p className="text-xs text-muted-foreground">Provided after session</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Follow-up</p>
                  <p className="text-xs text-muted-foreground">Available if needed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Session Timer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Time</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">45:30</div>
              <p className="text-sm text-muted-foreground">15 minutes remaining</p>
            </CardContent>
          </Card>

          {/* Agenda */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Agenda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Introduction & Goals</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <div>
                  <p className="text-sm font-medium">Problem Analysis</p>
                  <p className="text-xs text-muted-foreground">In progress</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-muted rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Solution Planning</p>
                  <p className="text-xs text-muted-foreground">Upcoming</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-muted rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Next Steps</p>
                  <p className="text-xs text-muted-foreground">Upcoming</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Chat */}
          {showChat && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  <div className="p-2 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">{bookingDetails.consultantName}</p>
                    <p className="text-sm">Great questions! I'll share some resources after our session.</p>
                  </div>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <p className="text-xs text-muted-foreground">You</p>
                    <p className="text-sm">Thank you! This is very helpful.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Request Notes
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Follow-up
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Star className="w-4 h-4 mr-2" />
                Rate Session
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Demo Notice */}
      <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
              <Video className="w-4 h-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Demo Session Preview</p>
              <p className="text-xs text-muted-foreground">
                This shows what your actual consultation session will look like. Real sessions include HD video, 
                screen sharing, session recording, and comprehensive follow-up materials.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}