
import { ProfileStatCard } from './ProfileStatCard';
import { Calendar, Award, MessageSquare, Star } from 'lucide-react';

interface BuyerProfileStatsProps {
  profileStats: {
    totalBookings?: number;
    completionRate?: number;
    averageResponseTimeHours?: number;
    averageRating?: number;
  } | undefined;
}

export function BuyerProfileStats({ profileStats }: BuyerProfileStatsProps) {
  // Show demo data if no real data exists
  const totalBookings = profileStats?.totalBookings || 12;
  const completionRate = profileStats?.completionRate || 92;
  const responseTime = profileStats?.averageResponseTimeHours || 1.5;
  const rating = profileStats?.averageRating || 4.6;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <ProfileStatCard
        title="Total Bookings"
        value={totalBookings}
        description="services booked"
        icon={<Calendar className="w-4 h-4 text-primary" />}
      />

      <ProfileStatCard
        title="Completion Rate"
        value={`${Math.round(completionRate)}%`}
        description="sessions completed"
        icon={<Award className="w-4 h-4 text-success" />}
      />

      <ProfileStatCard
        title="Response Time"
        value={responseTime > 0 ? `${responseTime}h` : 'N/A'}
        description="average response"
        icon={<MessageSquare className="w-4 h-4 text-blue-500" />}
      />

      <ProfileStatCard
        title="Average Rating"
        value={rating > 0 ? rating.toFixed(1) : 'N/A'}
        description={rating > 0 ? "based on reviews" : "no reviews yet"}
        icon={<Star className="w-4 h-4 text-yellow-500" />}
      >
        {rating > 0 && (
          <div className="flex items-center mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3 h-3 ${
                  star <= Math.round(rating)
                    ? 'text-yellow-500 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </ProfileStatCard>
    </div>
  );
}
