import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BookedService {
  id: string;
  service: string;
  consultant: string;
  date: string;
  time?: string;
  duration?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  points: number;
}

export interface UpcomingSession {
  id: string;
  service: string;
  consultant: string;
  date: string;
  time: string;
  duration: string;
  bookingUrl: string;
  status: 'confirmed' | 'pending';
  points: number;
}

export function useBookingData() {
  const { user } = useAuth();
  const [bookedServices, setBookedServices] = useState<BookedService[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [{ data: bookingsData }, { data: consultantProfiles }] = await Promise.all([
        // Fetch bookings with service and consultant info
        supabase
          .from('bookings')
          .select(`
            *,
            services!inner(title, duration_minutes),
            consultants(user_id)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),

        // Fetch consultant profiles for name mapping
        supabase
          .from('profiles')
          .select('user_id, full_name')
      ]);

      // Process bookings
      const processedBookings: BookedService[] = (bookingsData || []).map(b => {
        const consultant = Array.isArray(b.consultants) ? b.consultants[0] : b.consultants;
        const consultantProfile = consultantProfiles?.find(p => p.user_id === consultant?.user_id);
        
        return {
          id: b.id,
          service: b.services?.title || 'Unknown Service',
          consultant: consultantProfile?.full_name || 'Unknown Consultant',
          date: b.scheduled_at ? new Date(b.scheduled_at).toISOString().split('T')[0] : new Date(b.created_at).toISOString().split('T')[0],
          time: b.scheduled_at ? new Date(b.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
          duration: b.services?.duration_minutes ? `${b.services.duration_minutes} mins` : undefined,
          status: b.status,
          points: b.points_spent
        };
      });

      // Filter upcoming sessions (future bookings that are confirmed or pending only)
      const upcoming: UpcomingSession[] = processedBookings
        .filter(b => {
          const bookingDate = new Date(b.date);
          const now = new Date();
          return bookingDate > now && (b.status === 'confirmed' || b.status === 'pending');
        })
        .map(b => ({
          id: b.id,
          service: b.service,
          consultant: b.consultant,
          date: b.date,
          time: b.time || '00:00',
          duration: b.duration || '30 mins',
          bookingUrl: '#',
          status: b.status as 'confirmed' | 'pending',
          points: b.points
        }));

      setBookedServices(processedBookings);
      setUpcomingBookings(upcoming);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookedServices([]);
      setUpcomingBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user, fetchBookings]);

  // Calculate booking stats
  const servicesBooked = bookedServices.length;
  const completedSessions = bookedServices.filter(b => b.status === 'completed').length;
  const completionRate = servicesBooked > 0 ? Math.round((completedSessions / servicesBooked) * 100) : 0;

  return {
    bookedServices,
    upcomingBookings,
    servicesBooked,
    completedSessions,
    completionRate,
    isLoading,
    refreshBookings: fetchBookings,
  };
}