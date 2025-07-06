import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BookingProgressTracker } from "./BookingProgressTracker";
import { MockSessionInterface } from "./MockSessionInterface";
import { Check, Calendar, MessageCircle, Star, Clock, User, CreditCard } from 'lucide-react';
import { useState, useEffect } from 'react';

interface BookingDetails {
  id: string;
  serviceTitle: string;
  consultantName: string;
  consultantTier: string;
  price: number;
  duration?: number;
  description: string;
}

interface BookingSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingDetails: BookingDetails | null;
}

export function BookingSuccessModal({ open, onOpenChange, bookingDetails }: BookingSuccessModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showSessionDemo, setShowSessionDemo] = useState(false);

  useEffect(() => {
    if (open && bookingDetails) {
      // Simulate booking progress for demo
      const timer = setTimeout(() => setCurrentStep(1), 2000);
      const timer2 = setTimeout(() => setCurrentStep(2), 4000);
      const timer3 = setTimeout(() => setCurrentStep(3), 6000);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [open, bookingDetails]);

  if (!bookingDetails) return null;

  const getStepStatus = (stepIndex: number): "completed" | "pending" | "loading" => {
    if (stepIndex === 0) return "completed";
    return currentStep >= stepIndex ? "completed" : "pending";
  };

  const steps = [
    { label: "Booking Created", status: getStepStatus(0), time: "Just now" },
    { label: "Consultant Notified", status: getStepStatus(1), time: "2 min ago" },
    { label: "Calendar Invite Sent", status: getStepStatus(2), time: "4 min ago" },
    { label: "Session Confirmed", status: getStepStatus(3), time: "6 min ago" }
  ];

  if (showSessionDemo) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Session Preview</DialogTitle>
          </DialogHeader>
          <MockSessionInterface 
            bookingDetails={bookingDetails}
            onBack={() => setShowSessionDemo(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="flex items-center justify-center w-8 h-8 bg-success/10 rounded-full">
              <Check className="w-5 h-5 text-success" />
            </div>
            Booking Confirmed!
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Booking Details */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Service Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground">{bookingDetails.serviceTitle}</h3>
                  <p className="text-sm text-muted-foreground">{bookingDetails.description}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{bookingDetails.consultantName}</span>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {bookingDetails.consultantTier}
                  </Badge>
                </div>

                {bookingDetails.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{bookingDetails.duration} minutes</span>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Points Used</span>
                  <div className="flex items-center gap-1">
                    <CreditCard className="w-4 h-4 text-success" />
                    <span className="font-semibold">{bookingDetails.price} points</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What's Next?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-primary/10 rounded-full text-xs font-semibold text-primary">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-medium">You'll receive a calendar invite</p>
                    <p className="text-xs text-muted-foreground">Check your email in the next few minutes</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-primary/10 rounded-full text-xs font-semibold text-primary">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-medium">Consultant will reach out</p>
                    <p className="text-xs text-muted-foreground">They may ask for preparation materials</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-primary/10 rounded-full text-xs font-semibold text-primary">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-medium">Join your session</p>
                    <p className="text-xs text-muted-foreground">Use the link in your calendar invite</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Progress & Actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Booking Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <BookingProgressTracker steps={steps} />
              </CardContent>
            </Card>

            {/* Mock Communication */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Recent Messages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm font-medium">{bookingDetails.consultantName}</span>
                    <span className="text-xs text-muted-foreground">2 min ago</span>
                  </div>
                  <p className="text-sm">Hi! I've received your booking request and I'm excited to work with you. I'll send you a calendar invite shortly with all the details.</p>
                </div>
                
                {currentStep >= 2 && (
                  <div className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span className="text-sm font-medium">{bookingDetails.consultantName}</span>
                      <span className="text-xs text-muted-foreground">Just now</span>
                    </div>
                    <p className="text-sm">Calendar invite sent! Please let me know if you'd like to reschedule or have any questions before our session.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                className="w-full" 
                onClick={() => setShowSessionDemo(true)}
                disabled={currentStep < 3}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {currentStep < 3 ? "Session Preview (Available Soon)" : "Preview Session Experience"}
              </Button>
              
              <Button variant="outline" className="w-full">
                <MessageCircle className="w-4 h-4 mr-2" />
                Message Consultant
              </Button>
              
              <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                View Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Review Prompt */}
        <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} className="w-4 h-4 text-warning fill-warning" />
                ))}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Love our service?</p>
                <p className="text-xs text-muted-foreground">Rate your experience after the session to help other users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}