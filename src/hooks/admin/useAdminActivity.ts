import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  getDaysAgo, 
  createUserProfileMap, 
  createConsultantProfileMap,
  extractUserIds,
  extractConsultantIds,
  sortActivitiesByTimestamp,
  filterActivitiesByCategory,
  formatTimestamp,
  getTransactionContext
} from "@/utils/admin/adminHelpers";
import { DAYS_RANGE, LIMITS, ACTIVITY_TYPES } from "@/utils/admin/adminConstants";

export interface RecentActivity {
  id: string;
  type: "booking" | "service" | "completion" | "campaign" | "campaign_created" | "campaign_joined" | 
        "wallet_topup" | "campaign_purchase" | "service_purchase" | "points_deducted" | "monthly_billing" | 
        "campaign_status_change" | "admin_credit" | "admin_debit" | "subscription_upgrade" | 
        "subscription_downgrade" | "subscription_cancelled" | "proration_credit" | "referral_bonus" | 
        "commission_payment" | "manual_adjustment" | "refund" | "payment_failed" | "stripe_payment";
  description: string;
  points: number;
  timestamp: string; // formatted for display
  rawTimestamp: string; // raw ISO string for sorting
  category: "credit" | "debit" | "campaign" | "subscription" | "booking" | "system";
  emoji?: string;
}

export function useAdminActivity() {
  const { user } = useAuth();
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [filteredActivity, setFilteredActivity] = useState<RecentActivity[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const recentDate = getDaysAgo(DAYS_RANGE.RECENT_ACTIVITY);

      // Fetch all activity data in parallel
      const [
        recentBookingsResponse,
        recentServicesResponse,
        recentCompletionsResponse,
        recentCampaignsCreatedResponse,
        recentCampaignParticipationsResponse,
        recentPointsTransactionsResponse,
        recentMonthlyBillingResponse,
      ] = await Promise.all([
        supabase
          .from('bookings')
          .select(`
            id, points_spent, created_at, status, user_id,
            services!inner(title)
          `)
          .gte('created_at', recentDate)
          .order('created_at', { ascending: false })
          .limit(LIMITS.QUERY_BATCH_SIZE),
        
        supabase
          .from('services')
          .select('id, title, created_at, consultant_id')
          .gte('created_at', recentDate)
          .order('created_at', { ascending: false })
          .limit(LIMITS.QUERY_BATCH_SIZE),
        
        supabase
          .from('bookings')
          .select(`
            id, points_spent, updated_at, consultant_id,
            services!inner(title)
          `)
          .eq('status', 'completed')
          .gte('updated_at', recentDate)
          .order('updated_at', { ascending: false })
          .limit(LIMITS.QUERY_BATCH_SIZE),
        
        supabase
          .from('lead_gen_campaigns')
          .select('id, name, total_budget, created_at, created_by, status')
          .gte('created_at', recentDate)
          .order('created_at', { ascending: false })
          .limit(LIMITS.QUERY_BATCH_SIZE),
        
        supabase
          .from('campaign_participants')
          .select('id, budget_contribution, joined_at, consultant_name, user_id')
          .gte('joined_at', recentDate)
          .order('joined_at', { ascending: false })
          .limit(LIMITS.QUERY_BATCH_SIZE),
        
        supabase
          .from('flexi_credits_transactions')
          .select('id, amount, type, created_at, description, user_id, booking_id')
          .gte('created_at', recentDate)
          .order('created_at', { ascending: false })
          .limit(LIMITS.POINTS_TRANSACTIONS),
        
        supabase
          .from('monthly_billing_transactions')
          .select('id, amount, billing_date, user_id, campaign_id, created_at')
          .gte('created_at', recentDate)
          .order('created_at', { ascending: false })
          .limit(LIMITS.QUERY_BATCH_SIZE),
      ]);

      // Extract unique IDs for profile lookups
      const userIds = extractUserIds(
        recentBookingsResponse.data || [],
        recentCampaignsCreatedResponse.data || [],
        recentCampaignParticipationsResponse.data || [],
        recentPointsTransactionsResponse.data || [],
        recentMonthlyBillingResponse.data || []
      );

      const consultantIds = extractConsultantIds(
        recentServicesResponse.data || [],
        recentCompletionsResponse.data || []
      );

      // Fetch profiles
      const [userProfiles, consultantProfiles] = await Promise.all([
        userIds.size > 0 ? supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', Array.from(userIds)) : Promise.resolve({ data: [] }),
        consultantIds.size > 0 ? fetchConsultantProfiles(Array.from(consultantIds)) : Promise.resolve({ data: [] }),
      ]);

      // Create lookup maps
      const userProfileMap = createUserProfileMap(userProfiles.data || []);
      const consultantProfileMap = createConsultantProfileMap(consultantProfiles.data || []);

      // Handle missing user profiles from user_accounts fallback
      await handleMissingUserProfiles(userIds, userProfileMap);

      // Process activities
      const activities = processAllActivities({
        bookings: recentBookingsResponse.data || [],
        services: recentServicesResponse.data || [],
        completions: recentCompletionsResponse.data || [],
        campaigns: recentCampaignsCreatedResponse.data || [],
        participations: recentCampaignParticipationsResponse.data || [],
        transactions: recentPointsTransactionsResponse.data || [],
        billing: recentMonthlyBillingResponse.data || [],
        userProfileMap,
        consultantProfileMap
      });

      const sortedActivities = sortActivitiesByTimestamp(activities).slice(0, LIMITS.RECENT_ACTIVITIES);

      setRecentActivity(sortedActivities);
      setFilteredActivity(sortedActivities);

    } catch (err) {
      console.error('Error fetching admin activity:', err);
      setError('Failed to load activity data');
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultantProfiles = async (consultantIds: string[]) => {
    const consultantsResult = await supabase
      .from('consultants')
      .select('id, user_id')
      .in('id', consultantIds);

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
  };

  const handleMissingUserProfiles = async (userIds: Set<string>, userProfileMap: Map<string, string>) => {
    const missingUserIds = Array.from(userIds).filter(id => !userProfileMap.has(id));
    if (missingUserIds.length > 0) {
      const accountsRes = await supabase
        .from('user_accounts')
        .select('user_id, full_name, email')
        .in('user_id', missingUserIds);
      
      if (accountsRes.data) {
        accountsRes.data.forEach((a: any) => {
          if (a.user_id && !userProfileMap.has(a.user_id)) {
            const nameFromFull = a.full_name?.toLowerCase().split(' ')[0];
            const nameFromEmail = a.email?.split('@')[0].toLowerCase();
            const displayName = nameFromFull || nameFromEmail || 'user';
            userProfileMap.set(a.user_id, displayName);
          }
        });
      }
    }
  };

  const processAllActivities = (data: {
    bookings: any[];
    services: any[];
    completions: any[];
    campaigns: any[];
    participations: any[];
    transactions: any[];
    billing: any[];
    userProfileMap: Map<string, string>;
    consultantProfileMap: Map<string, string>;
  }): RecentActivity[] => {
    const activities: RecentActivity[] = [];

    // Process bookings
    data.bookings.forEach(booking => {
      const userName = data.userProfileMap.get(booking.user_id) || 'user';
      activities.push({
        id: `booking-${booking.id}`,
        type: 'booking',
        description: `${userName} booked ${booking.services?.title || 'service'}`,
        points: booking.points_spent,
        timestamp: formatTimestamp(booking.created_at),
        rawTimestamp: booking.created_at,
        category: 'booking',
        emoji: '📅',
      });
    });

    // Process services
    data.services.forEach(service => {
      const consultantName = data.consultantProfileMap.get(service.consultant_id) || 'Consultant';
      activities.push({
        id: `service-${service.id}`,
        type: 'service',
        description: `${consultantName} added ${service.title}`,
        points: 0,
        timestamp: formatTimestamp(service.created_at),
        rawTimestamp: service.created_at,
        category: 'system',
        emoji: '🔧',
      });
    });

    // Process completions
    data.completions.forEach(booking => {
      const consultantName = data.consultantProfileMap.get(booking.consultant_id) || 'consultant';
      activities.push({
        id: `completion-${booking.id}`,
        type: 'completion',
        description: `${booking.services?.title || 'Service'} completed by ${consultantName}`,
        points: booking.points_spent,
        timestamp: formatTimestamp(booking.updated_at),
        rawTimestamp: booking.updated_at,
        category: 'booking',
        emoji: '✅',
      });
    });

    // Process campaign creations
    data.campaigns.forEach(campaign => {
      const creatorName = data.userProfileMap.get(campaign.created_by) || 'Admin';
      activities.push({
        id: `campaign-created-${campaign.id}`,
        type: 'campaign_created',
        description: `${creatorName} created campaign "${campaign.name}" with $${campaign.total_budget} budget`,
        points: campaign.total_budget,
        timestamp: formatTimestamp(campaign.created_at),
        rawTimestamp: campaign.created_at,
        category: 'campaign',
        emoji: '🚀',
      });
    });

    // Process campaign participations
    data.participations.forEach(participation => {
      const userName = participation.consultant_name || data.userProfileMap.get(participation.user_id) || 'user';
      activities.push({
        id: `campaign-joined-${participation.id}`,
        type: 'campaign_joined',
        description: `${userName} signed up for Facebook ads campaign with $${participation.budget_contribution} contribution`,
        points: participation.budget_contribution,
        timestamp: formatTimestamp(participation.joined_at),
        rawTimestamp: participation.joined_at,
        category: 'campaign',
        emoji: '🎯',
      });
    });

    // Process transactions with enhanced categorization
    data.transactions.forEach(transaction => {
      const activity = processTransactionEnhanced(transaction, data.userProfileMap);
      if (activity) activities.push(activity);
    });

    // Process billing
    data.billing.forEach(billing => {
      const userName = data.userProfileMap.get(billing.user_id) || 'User';
      activities.push({
        id: `billing-${billing.id}`,
        type: 'monthly_billing',
        description: `Monthly billing: $${billing.amount} charged to ${userName} for campaign`,
        points: billing.amount,
        timestamp: formatTimestamp(billing.created_at),
        rawTimestamp: billing.created_at,
        category: 'debit',
        emoji: '📅',
      });
    });

    return activities;
  };

  const processTransactionEnhanced = (transaction: any, userProfileMap: Map<string, string>): RecentActivity | null => {
    const userName = userProfileMap.get(transaction.user_id) || 'user';
    const context = getTransactionContext(transaction);
    const amount = Math.abs(transaction.amount);
    
    let activityType: RecentActivity['type'] = 'wallet_topup';
    let description = '';
    let category: RecentActivity['category'] = 'credit';
    let emoji = '💰';

    // Enhanced processing for admin actions and subscription changes
    switch (transaction.type) {
      case 'admin_credit':
        activityType = 'admin_credit';
        category = 'credit';
        emoji = '🔝';
        const creditReason = transaction.description?.replace('Admin credit - ', '').replace(/flexi credits added by admin: /, '').trim();
        if (creditReason && creditReason !== 'nil' && creditReason !== 'no reason') {
          description = `💰 Admin added ${amount} flexi credits to ${userName} - ${creditReason}`;
        } else {
          description = `💰 Admin added ${amount} flexi credits to ${userName}`;
        }
        break;
        
      case 'refund':
        if (context.isAdminAction && transaction.amount < 0) {
          activityType = 'admin_debit';
          category = 'debit';
          emoji = '🔻';
          const debitReason = transaction.description?.replace('Admin deduction - ', '').replace(/flexi credits deducted by admin: /, '').trim();
          if (debitReason && debitReason !== 'nil' && debitReason !== 'no reason') {
            description = `⚠️ Admin deducted ${amount} flexi credits from ${userName} - ${debitReason}`;
          } else {
            description = `⚠️ Admin deducted ${amount} flexi credits from ${userName}`;
          }
        } else {
          activityType = 'refund';
          category = 'credit';
          emoji = '↩️';
          description = `↩️ ${amount} flexi credits refunded to ${userName}`;
        }
        break;
        
      case 'purchase':
        category = 'debit';
        if (context.isServicePurchase) {
          activityType = 'service_purchase';
          description = `🛒 ${userName} purchased service for ${amount} flexi credits`;
          emoji = '🛒';
        } else if (context.isCampaignRelated) {
          activityType = 'campaign_purchase';
          description = `📈 ${userName} invested ${amount} flexi credits in campaign`;
          emoji = '📈';
        } else if (context.isStripePayment) {
          activityType = 'stripe_payment';
          description = `💳 ${userName} purchased ${amount} flexi credits via Stripe`;
          category = 'credit';
          emoji = '💳';
        } else {
          activityType = 'manual_adjustment';
          description = `💸 ${userName} spent ${amount} flexi credits`;
          emoji = '💸';
        }
        break;
        
      case 'initial_credit':
        activityType = 'wallet_topup';
        description = `🎉 ${userName} received ${amount} welcome flexi credits`;
        emoji = '🎉';
        break;
        
      case 'earning':
        if (transaction.description?.toLowerCase().includes('referral')) {
          activityType = 'referral_bonus';
          description = `🤝 ${userName} earned ${amount} flexi credits from referral bonus`;
          emoji = '🤝';
        } else if (transaction.description?.toLowerCase().includes('commission')) {
          activityType = 'commission_payment';
          description = `💼 ${userName} received ${amount} flexi credits as commission`;
          emoji = '💼';
        } else {
          activityType = 'wallet_topup';
          description = `⭐ ${userName} earned ${amount} flexi credits`;
          emoji = '⭐';
        }
        break;
        
      default:
        // Enhanced subscription activity detection
        const desc = transaction.description?.toLowerCase() || '';
        if (context.isSubscriptionRelated || desc.includes('subscription') || desc.includes('plan') || desc.includes('upgrade') || desc.includes('downgrade')) {
          category = 'subscription';
          if (desc.includes('upgrade') || desc.includes('plan upgrade')) {
            activityType = 'subscription_upgrade';
            description = `⬆️ ${userName} upgraded subscription plan (+${amount} flexi credits)`;
            emoji = '⬆️';
          } else if (desc.includes('downgrade') || desc.includes('plan downgrade')) {
            activityType = 'subscription_downgrade';
            description = `⬇️ ${userName} downgraded subscription plan`;
            emoji = '⬇️';
          } else if (desc.includes('proration')) {
            activityType = 'proration_credit';
            description = `⚖️ ${userName} received ${amount} flexi credits as proration credit`;
            emoji = '⚖️';
          } else if (desc.includes('cancelled')) {
            activityType = 'subscription_cancelled';
            description = `❌ ${userName} cancelled subscription`;
            emoji = '❌';
          } else if (desc.includes('monthly subscription') || desc.includes('subscription renewal')) {
            activityType = 'subscription_upgrade';
            description = `🔄 ${userName} received ${amount} flexi credits from monthly subscription`;
            emoji = '🔄';
          } else {
            activityType = 'subscription_upgrade';
            description = `📋 ${userName} subscription activity: ${amount} flexi credits`;
            emoji = '📋';
          }
        } else {
          // Fallback for any other transaction types
          activityType = 'manual_adjustment';
          description = `🔧 ${userName} - ${transaction.type}: ${amount} flexi credits`;
          emoji = '🔧';
        }
    }

    return {
      id: `flexi-${transaction.id}`,
      type: activityType,
      description,
      points: amount,
      timestamp: formatTimestamp(transaction.created_at),
      rawTimestamp: transaction.created_at,
      category,
      emoji,
    };
  };

  const filterActivities = (filter: string) => {
    setActiveFilter(filter);
    const filtered = filterActivitiesByCategory(recentActivity, filter);
    setFilteredActivity(filtered);
  };

  useEffect(() => {
    if (user) {
      fetchActivity();
    }
  }, [user]);

  useEffect(() => {
    // Re-apply current filter when recentActivity changes
    filterActivities(activeFilter);
  }, [recentActivity]);

  return {
    recentActivity: filteredActivity,
    allActivity: recentActivity,
    activeFilter,
    filterActivities,
    loading,
    error,
    refreshActivity: fetchActivity
  };
}