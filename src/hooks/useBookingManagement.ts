// Re-export types
export type { BookingWithDetails, Review } from '@/types/booking';

// Re-export booking operations
export { 
  useBookingForConversation, 
  useUpdateBookingStatus 
} from '@/hooks/useBookingOperations';

// Re-export review operations
export { 
  useCreateReview, 
  useBookingReviews 
} from '@/hooks/useReviewOperations';