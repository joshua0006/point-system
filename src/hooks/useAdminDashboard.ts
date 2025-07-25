import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AdminStats {
  totalUsers: number;
  activeConsultants: number;
  activeServices: number;
  activeBookings: number;
  monthlyVolume: number;
}

export interface RecentActivity {
  id: string;
  type: "booking" | "service" | "completion" | "campaign";
  description: string;
  points: number;
  timestamp: string;
}

export function useAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeConsultants: 0,
    activeServices: 0,
    activeBookings: 0,
    monthlyVolume: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stats in parallel
      const [
        usersResponse,
        consultantsResponse,
        servicesResponse,
        bookingsResponse,
        transactionsResponse,
        recentBookingsResponse,
        recentServicesResponse,
        recentCompletionsResponse,
        recentCampaignsResponse,
      ] = await Promise.all([
        // Total approved users
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('approval_status', 'approved'),
        
        // Active consultants
        supabase
          .from('consultants')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        
        // Active services
        supabase
          .from('services')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        
        // Active bookings
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'confirmed']),
        
        // Monthly volume (current month purchases)
        supabase
          .from('points_transactions')
          .select('amount')
          .eq('type', 'purchase')
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        
        // Recent bookings for activity
        supabase
          .from('bookings')
          .select(`
            id,
            points_spent,
            created_at,
            status,
            user_id,
            services!inner(title)
          `)
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Recent services for activity
        supabase
          .from('services')
          .select(`
            id,
            title,
            created_at,
            consultant_id
          `)
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Recent completions
        supabase
          .from('bookings')
          .select(`
            id,
            points_spent,
            updated_at,
            consultant_id,
            services!inner(title)
          `)
          .eq('status', 'completed')
          .order('updated_at', { ascending: false })
          .limit(5),
        
        // Recent campaign participations
        supabase
          .from('points_transactions')
          .select(`
            id,
            amount,
            created_at,
            description
          `)
          .eq('type', 'purchase')
          .ilike('description', '%Campaign%')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      // Process stats
      const totalUsers = usersResponse.count || 0;
      const activeConsultants = consultantsResponse.count || 0;
      const activeServices = servicesResponse.count || 0;
      const activeBookings = bookingsResponse.count || 0;
      const monthlyVolume = transactionsResponse.data?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

      setStats({
        totalUsers,
        activeConsultants,
        activeServices,
        activeBookings,
        monthlyVolume,
      });

      // Process recent activity
      const activities: RecentActivity[] = [];

      // Get unique user IDs and consultant IDs for profile lookups
      const userIds = new Set<string>();
      const consultantIds = new Set<string>();

      recentBookingsResponse.data?.forEach(booking => {
        userIds.add(booking.user_id);
      });

      recentServicesResponse.data?.forEach(service => {
        consultantIds.add(service.consultant_id);
      });

      recentCompletionsResponse.data?.forEach(booking => {
        consultantIds.add(booking.consultant_id);
      });

      // Fetch profiles for users and consultants
      const [userProfiles, consultantProfiles] = await Promise.all([
        userIds.size > 0 ? supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', Array.from(userIds)) : Promise.resolve({ data: [] }),
        consultantIds.size > 0 ? supabase
          .from('consultants')
          .select('id, user_id')
          .in('id', Array.from(consultantIds))
          .then(async (consultantsResult) => {
            if (consultantsResult.data && consultantsResult.data.length > 0) {
              const consultantUserIds = consultantsResult.data.map(c => c.user_id);
              const profilesResult = await supabase
                .from('profiles')
                .select('user_id, full_name')
                .in('user_id', consultantUserIds);
              
              return {
                data: consultantsResult.data.map(consultant => ({
                  ...consultant,
                  profile: profilesResult.data?.find(p => p.user_id === consultant.user_id)
                }))
              };
            }
            return { data: [] };
          }) : Promise.resolve({ data: [] }),
      ]);

      // Create lookup maps
      const userProfileMap = new Map<string, string>();
      userProfiles.data?.forEach(p => {
        if (p.user_id && p.full_name) {
          userProfileMap.set(p.user_id, p.full_name);
        }
      });

      const consultantProfileMap = new Map<string, string>();
      consultantProfiles.data?.forEach(c => {
        if (c.id && c.profile?.full_name) {
          consultantProfileMap.set(c.id, c.profile.full_name);
        }
      });

      // Add recent bookings
      recentBookingsResponse.data?.forEach(booking => {
        const userName = userProfileMap.get(booking.user_id) || 'User';
        activities.push({
          id: `booking-${booking.id}`,
          type: 'booking',
          description: `${userName} booked ${booking.services?.title || 'service'}`,
          points: booking.points_spent,
          timestamp: formatTimestamp(booking.created_at),
        });
      });

      // Add recent services
      recentServicesResponse.data?.forEach(service => {
        const consultantName = consultantProfileMap.get(service.consultant_id) || 'Consultant';
        activities.push({
          id: `service-${service.id}`,
          type: 'service',
          description: `${consultantName} added ${service.title}`,
          points: 0,
          timestamp: formatTimestamp(service.created_at),
        });
      });

      // Add recent completions
      recentCompletionsResponse.data?.forEach(booking => {
        const consultantName = consultantProfileMap.get(booking.consultant_id) || 'consultant';
        activities.push({
          id: `completion-${booking.id}`,
          type: 'completion',
          description: `${booking.services?.title || 'Service'} completed by ${consultantName}`,
          points: booking.points_spent,
          timestamp: formatTimestamp(booking.updated_at),
        });
      });

      // Add recent campaigns
      recentCampaignsResponse.data?.forEach(transaction => {
        activities.push({
          id: `campaign-${transaction.id}`,
          type: 'campaign',
          description: transaction.description || 'Campaign purchase',
          points: Math.abs(transaction.amount),
          timestamp: formatTimestamp(transaction.created_at),
        });
      });

      // Sort by timestamp and take top 10
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      setRecentActivity(sortedActivities);

    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes <= 0 ? 'Just now' : `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    }
  };

  return {
    stats,
    recentActivity,
    loading,
    error,
    refreshData: fetchAdminData,
  };
}