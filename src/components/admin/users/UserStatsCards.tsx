import { memo } from "react";
import { StatsCard } from "@/components/ui/stats-card";
import { Users, Coins } from '@/lib/icons';
import type { UserProfile } from "@/config/types";

interface UserStatsCardsProps {
  users: UserProfile[];
}

export const UserStatsCards = memo(function UserStatsCards({ users }: UserStatsCardsProps) {
  const stats = {
    totalUsers: users.length,
    totalFlexiCredits: users.reduce((sum, user) => sum + (user.flexi_credits_balance || 0), 0),
    adminUsers: users.filter(u => u.role === 'admin').length,
    consultantUsers: users.filter(u => u.role === 'consultant').length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatsCard
        title="Total Users"
        value={stats.totalUsers}
        subtitle="Registered users"
        icon={Users}
      />
      
      <StatsCard
        title="Total Flexi Credits"
        value={stats.totalFlexiCredits.toLocaleString()}
        subtitle="Across all users"
        icon={Coins}
        className="text-accent"
      />
      
      <StatsCard
        title="Consultants"
        value={stats.consultantUsers}
        subtitle="Active consultants"
        className="text-success"
      />
      
      <StatsCard
        title="Admins"
        value={stats.adminUsers}
        subtitle="System admins"
        className="text-destructive"
      />
    </div>
  );
});