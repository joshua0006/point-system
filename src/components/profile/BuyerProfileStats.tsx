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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <ProfileStatCard
        title="Total Bookings"
        value={profileStats?.totalBookings || 0}
        description="services booked"
        icon={<Calendar className="w-4 h-4 text-primary" />}
      />

      <ProfileStatCard
        title="Completion Rate"
        value={`${Math.round(profileStats?.completionRate || 0)}%`}
        description="sessions completed"
        icon={<Award className="w-4 h-4 text-success" />}
      />

      <ProfileStatCard
        title="Response Time"
        value={`${profileStats?.averageResponseTimeHours || 0}h`}
        description="average response"
        icon={<MessageSquare className="w-4 h-4 text-blue-500" />}
      />

      <ProfileStatCard
        title="Average Rating"
        value={profileStats?.averageRating?.toFixed(1) || 'N/A'}
        description=""
        icon={<Star className="w-4 h-4 text-yellow-500" />}
      >
        <div className="flex items-center mt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-3 h-3 ${
                star <= Math.round(profileStats?.averageRating || 0)
                  ? 'text-yellow-500 fill-current'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
      </ProfileStatCard>
    </div>
  );
}