import { memo, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, DollarSign, Star, User } from '@/lib/icons';
import { BookingWithDetails, useUpdateBookingStatus } from '@/hooks/useBookingManagement';
import { useAuth } from '@/contexts/AuthContext';
import { ReviewModal } from './ReviewModal';
import { useBookingReviews } from '@/hooks/useReviewOperations';

interface BookingCardProps {
  booking: BookingWithDetails;
}

export const BookingCard = memo(function BookingCard({ booking }: BookingCardProps) {
  const { user } = useAuth();
  const updateStatus = useUpdateBookingStatus();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const { data: existingReviews = [] } = useBookingReviews(booking.id);

  const isConsultant = user?.id !== booking.user_id;
  const otherParty = useMemo(() =>
    isConsultant ? booking.buyer_profile : booking.consultant_profile,
    [isConsultant, booking.buyer_profile, booking.consultant_profile]
  );
  const otherPartyId = useMemo(() =>
    isConsultant ? booking.user_id : booking.consultant_profile.user_id,
    [isConsultant, booking.user_id, booking.consultant_profile.user_id]
  );

  // Check if current user has already submitted a review for this booking
  const hasUserReviewed = useMemo(() =>
    existingReviews.some(review => review.reviewer_id === user?.id),
    [existingReviews, user?.id]
  );

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'pending': return 'bg-accent/10 text-accent border-accent/30';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }, []);

  const handleStatusUpdate = useCallback(async (newStatus: 'confirmed' | 'completed' | 'cancelled') => {
    updateStatus.mutate({
      bookingId: booking.id,
      status: newStatus,
    });
  }, [updateStatus, booking.id]);

  const getActionButtons = useCallback(() => {
    if (booking.status === 'pending' && isConsultant) {
      return (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={() => handleStatusUpdate('confirmed')}
            disabled={updateStatus.isPending}
          >
            Confirm Purchase
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => handleStatusUpdate('cancelled')}
            disabled={updateStatus.isPending}
          >
            Decline
          </Button>
        </div>
      );
    }

    if (booking.status === 'confirmed') {
      const userCompleted = isConsultant ? booking.consultant_completed : booking.buyer_completed;
      const otherCompleted = isConsultant ? booking.buyer_completed : booking.consultant_completed;

      if (userCompleted && !otherCompleted) {
        return (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Waiting for other party to mark as completed</p>
            <Badge variant="secondary">Completion Pending</Badge>
          </div>
        );
      }

      return (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={() => handleStatusUpdate('completed')}
            disabled={updateStatus.isPending}
          >
            Mark as Completed
          </Button>
        </div>
      );
    }

    if (booking.status === 'completed' && !hasUserReviewed) {
      return (
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => setReviewModalOpen(true)}
        >
          <Star className="w-4 h-4 mr-1" />
          Leave Review
        </Button>
      );
    }

    return null;
  }, [booking.status, isConsultant, booking.consultant_completed, booking.buyer_completed, hasUserReviewed, updateStatus.isPending, handleStatusUpdate]);

  return (
    <>
      <Card className="mb-4 border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {booking.services.image_url && (
                <img
                  src={booking.services.image_url}
                  alt={booking.services.title}
                  className="w-12 h-12 rounded-lg object-cover"
                  loading="lazy"
                  decoding="async"
                />
              )}
              <div>
                <h3 className="font-semibold text-lg">{booking.services.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {booking.services.description}
                </p>
              </div>
            </div>
            <Badge className={getStatusColor(booking.status)}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Participant Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Avatar className="w-8 h-8">
              <AvatarImage src={otherParty.avatar_url || undefined} />
              <AvatarFallback>
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">
                {isConsultant ? 'Client' : 'Consultant'}: {otherParty.full_name || otherParty.email}
              </p>
              <p className="text-sm text-muted-foreground">{otherParty.email}</p>
            </div>
          </div>

          {/* Booking Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span>{booking.points_spent} points</span>
            </div>
            {booking.services.duration_minutes && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{booking.services.duration_minutes} minutes</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{new Date(booking.created_at).toLocaleDateString()}</span>
            </div>
            {booking.scheduled_at && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{new Date(booking.scheduled_at).toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {getActionButtons() && (
            <div className="pt-2 border-t">
              {getActionButtons()}
            </div>
          )}
        </CardContent>
      </Card>

      <ReviewModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        bookingId={booking.id}
        revieweeId={otherPartyId}
        revieweeName={otherParty.full_name || otherParty.email}
      />
    </>
  );
});