import { useQuery } from '@tanstack/react-query';
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

export function useOptimizedBookingData() {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: async (): Promise<{
      bookedServices: BookedService[];
      upcomingBookings: UpcomingSession[];
      servicesBooked: number;
      completedSessions: number;
      completionRate: number;
    }> => {
      if (!user) {
        return {
          bookedServices: [],
          upcomingBookings: [],
          servicesBooked: 0,
          completedSessions: 0,
          completionRate: 0,
        };
      }

      // Parallel queries for better performance
      const [{ data: bookingsData }, { data: consultantProfiles }] = await Promise.all([
        supabase
          .from('bookings')
          .select(`
            *,
            services!inner(title, duration_minutes),
            consultants!bookings_consultant_id_fkey(user_id)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),

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

      // Filter upcoming sessions
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

      // Calculate stats
      const servicesBooked = processedBookings.length;
      const completedSessions = processedBookings.filter(b => b.status === 'completed').length;
      const completionRate = servicesBooked > 0 ? Math.round((completedSessions / servicesBooked) * 100) : 0;

      return {
        bookedServices: processedBookings,
        upcomingBookings: upcoming,
        servicesBooked,
        completedSessions,
        completionRate,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes for booking data
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    bookedServices: data?.bookedServices || [],
    upcomingBookings: data?.upcomingBookings || [],
    servicesBooked: data?.servicesBooked || 0,
    completedSessions: data?.completedSessions || 0,
    completionRate: data?.completionRate || 0,
    isLoading,
    error,
    refreshBookings: refetch,
  };
}