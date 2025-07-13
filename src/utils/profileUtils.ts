
import { supabase } from '@/integrations/supabase/client';

export interface ExperienceLevelInfo {
  level: 'Newcomer' | 'Regular' | 'Experienced' | 'Expert';
  color: string;
  description: string;
}

export function getExperienceLevel(totalBookings: number = 0): ExperienceLevelInfo {
  if (totalBookings === 0) {
    return {
      level: 'Newcomer',
      color: 'bg-blue-100 text-blue-800',
      description: 'New to the platform'
    };
  } else if (totalBookings < 5) {
    return {
      level: 'Regular',
      color: 'bg-green-100 text-green-800',
      description: 'Getting started'
    };
  } else if (totalBookings < 20) {
    return {
      level: 'Experienced',
      color: 'bg-purple-100 text-purple-800',
      description: 'Experienced user'
    };
  } else {
    return {
      level: 'Expert',
      color: 'bg-gold-100 text-gold-800',
      description: 'Platform expert'
    };
  }
}

export async function getBuyerProfileStats(userId: string) {
  try {
    // Get actual bookings for this user
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId);

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return {
        totalBookings: 0,
        completionRate: 0,
        averageResponseTimeHours: 0,
        averageRating: 0,
        experienceLevel: getExperienceLevel(0),
        consultationCategories: []
      };
    }

    const totalBookings = bookings?.length || 0;
    const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

    // Get conversation categories for this user
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select(`
        service_id,
        services!inner(
          title,
          categories!inner(name)
        )
      `)
      .eq('buyer_id', userId);

    let consultationCategories: Array<{ name: string; count: number }> = [];
    
    if (!conversationsError && conversations) {
      const categoryMap = new Map<string, number>();
      
      conversations.forEach(conv => {
        const categoryName = conv.services?.categories?.name;
        if (categoryName) {
          categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1);
        }
      });
      
      consultationCategories = Array.from(categoryMap.entries()).map(([name, count]) => ({
        name,
        count
      }));
    }

    return {
      totalBookings,
      completionRate,
      averageResponseTimeHours: 0, // Real calculation would need message timestamps
      averageRating: 0, // Real calculation would need review system
      experienceLevel: getExperienceLevel(totalBookings),
      consultationCategories
    };
  } catch (error) {
    console.error('Error calculating buyer profile stats:', error);
    return {
      totalBookings: 0,
      completionRate: 0,
      averageResponseTimeHours: 0,
      averageRating: 0,
      experienceLevel: getExperienceLevel(0),
      consultationCategories: []
    };
  }
}

export async function getConsultantProfileStats(userId: string) {
  try {
    // Get consultant data
    const { data: consultant, error: consultantError } = await supabase
      .from('consultants')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (consultantError || !consultant) {
      return {
        totalBookings: 0,
        completionRate: 0,
        averageResponseTimeHours: 0,
        averageRating: 0,
        totalEarnings: 0,
        activeServices: 0,
        experienceLevel: getExperienceLevel(0)
      };
    }

    // Get bookings for this consultant
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('consultant_id', consultant.id);

    if (bookingsError) {
      console.error('Error fetching consultant bookings:', bookingsError);
      return {
        totalBookings: 0,
        completionRate: 0,
        averageResponseTimeHours: 0,
        averageRating: 0,
        totalEarnings: 0,
        activeServices: 0,
        experienceLevel: getExperienceLevel(0)
      };
    }

    const totalBookings = bookings?.length || 0;
    const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
    const totalEarnings = bookings?.reduce((sum, booking) => sum + (booking.points_spent || 0), 0) || 0;

    // Get active services count
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id')
      .eq('consultant_id', consultant.id)
      .eq('is_active', true);

    const activeServices = services?.length || 0;

    return {
      totalBookings,
      completionRate,
      averageResponseTimeHours: 0, // Real calculation would need message timestamps
      averageRating: 0, // Real calculation would need review system
      totalEarnings,
      activeServices,
      experienceLevel: getExperienceLevel(totalBookings)
    };
  } catch (error) {
    console.error('Error calculating consultant profile stats:', error);
    return {
      totalBookings: 0,
      completionRate: 0,
      averageResponseTimeHours: 0,
      averageRating: 0,
      totalEarnings: 0,
      activeServices: 0,
      experienceLevel: getExperienceLevel(0)
    };
  }
}
