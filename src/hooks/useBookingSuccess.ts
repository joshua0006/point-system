import { useState, useCallback } from 'react';

interface BookingDetails {
  id: string;
  serviceTitle: string;
  consultantName: string;
  consultantTier: string;
  price: number;
  duration?: number;
  description: string;
}

export function useBookingSuccess() {
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);

  const showSuccessModal = useCallback((details: BookingDetails) => {
    setBookingDetails(details);
    setIsSuccessModalOpen(true);
  }, []);

  const hideSuccessModal = useCallback(() => {
    setIsSuccessModalOpen(false);
    setBookingDetails(null);
  }, []);

  return {
    isSuccessModalOpen,
    bookingDetails,
    showSuccessModal,
    hideSuccessModal,
  };
}