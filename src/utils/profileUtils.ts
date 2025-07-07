
import { supabase } from '@/integrations/supabase/client';

export type ExperienceLevel = 'newcomer' | 'regular' | 'experienced' | 'expert';

export interface ExperienceLevelInfo {
  level: ExperienceLevel;
  label: string;
  color: string;
  minPoints: number;
}

export const experienceLevels: Record<ExperienceLevel, ExperienceLevelInfo> = {
  newcomer: {
    level: 'newcomer',
    label: 'Newcomer',
    color: 'bg-gray-500',
    minPoints: 0
  },
  regular: {
    level: 'regular', 
    label: 'Regular',
    color: 'bg-blue-500',
    minPoints: 500
  },
  experienced: {
    level: 'experienced',
    label: 'Experienced', 
    color: 'bg-purple-500',
    minPoints: 2000
  },
  expert: {
    level: 'expert',
    label: 'Expert Client',
    color: 'bg-gold-500',
    minPoints: 5000
  }
};

export function getExperienceLevel(totalPointsSpent: number): ExperienceLevelInfo {
  if (totalPointsSpent >= 5000) return experienceLevels.expert;
  if (totalPointsSpent >= 2000) return experienceLevels.experienced;
  if (totalPointsSpent >= 500) return experienceLevels.regular;
  return experienceLevels.newcomer;
}

export async function getBuyerProfileStats(userId: string) {
  // Get total points spent
  const { data: transactions } = await supabase
    .from('points_transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('type', 'purchase');

  const totalPointsSpent = transactions?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

  // Get bookings with service categories
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      services (
        title,
        categories (
          name
        )
      )
    `)
    .eq('user_id', userId);

  const totalBookings = bookings?.length || 0;
  const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0;
  const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

  // Calculate consultation categories
  const categoryMap = new Map<string, number>();
  bookings?.forEach(booking => {
    const categoryName = booking.services?.categories?.name;
    if (categoryName) {
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1);
    }
  });

  const consultationCategories = Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // For now, set placeholder values for response rate and rating
  // These would need message/rating tracking implementation
  const responseRate = Math.floor(Math.random() * 20) + 80; // 80-100%
  const averageRating = 4.2 + Math.random() * 0.7; // 4.2-4.9

  return {
    totalPointsSpent,
    experienceLevel: getExperienceLevel(totalPointsSpent),
    totalBookings,
    completedBookings,
    completionRate,
    consultationCategories,
    responseRate,
    averageRating
  };
}
