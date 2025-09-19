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

// Normalize to first name (lowercase)
const toFirstName = (value?: string | null) => {
  if (!value) return null;
  const base = value.includes('@') ? value.split('@')[0] : value;
  const first = base.trim().split(/\s+/)[0];
  return first.toLowerCase();
};

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
  const [filteredActivity, setFilteredActivity] = useState<RecentActivity[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAdminData();
      
      // Set up real-time listeners for activity updates
      const flexi_credits_channel = supabase
        .channel('admin-flexi-credits')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'flexi_credits_transactions'
        }, () => {
          fetchAdminData();
        })
        .subscribe();

      const bookings_channel = supabase
        .channel('admin-bookings')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'bookings'
        }, () => {
          fetchAdminData();
        })
        .subscribe();

      const campaigns_channel = supabase
        .channel('admin-campaigns')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'lead_gen_campaigns'
        }, () => {
          fetchAdminData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(flexi_credits_channel);
        supabase.removeChannel(bookings_channel);
        supabase.removeChannel(campaigns_channel);
      };
    }
  }, [user]);

  const fetchAdminData = async () => {
    console.log('🔄 Starting admin data fetch...');
    try {
      setLoading(true);
      setError(null);

      // Fetch admin stats first
      const adminStatsResponse = await supabase.rpc('get_admin_stats');
      console.log('📊 Admin stats response:', adminStatsResponse);
      
      if (adminStatsResponse.error) {
        throw new Error(`Admin access denied: ${adminStatsResponse.error.message}`);
      }

      const adminStats = adminStatsResponse.data;

      // Fetch other data in parallel
      const [
        transactionsResponse,
        recentBookingsResponse,
        recentServicesResponse,
        recentCompletionsResponse,
        recentCampaignsCreatedResponse,
        recentCampaignParticipationsResponse,
        recentPointsTransactionsResponse,
        recentMonthlyBillingResponse,
      ] = await Promise.all([
        
        // Monthly volume (current month purchases)
        supabase
        .from('flexi_credits_transactions')
          .select('amount')
          .eq('type', 'purchase')
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        
        // Recent bookings for activity (last 30 days)
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
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(50),
        
        // Recent services for activity (last 30 days)
        supabase
          .from('services')
          .select(`
            id,
            title,
            created_at,
            consultant_id
          `)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(50),
        
        // Recent completions (last 30 days)
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
          .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('updated_at', { ascending: false })
          .limit(50),
        
        // Recent campaign creations (last 30 days)
        supabase
          .from('lead_gen_campaigns')
          .select(`
            id,
            name,
            total_budget,
            created_at,
            created_by,
            status
          `)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(50),
        
        // Recent campaign participations (last 30 days)
        supabase
          .from('campaign_participants')
          .select(`
            id,
            budget_contribution,
            joined_at,
            consultant_name,
            user_id
          `)
          .gte('joined_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('joined_at', { ascending: false })
          .limit(50),
        
        // Recent points transactions (all types, last 30 days for better coverage)
        supabase
          .from('flexi_credits_transactions')
          .select(`
            id,
            amount,
            type,
            created_at,
            description,
            user_id,
            booking_id
          `)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(100),
        
        // Recent monthly billing transactions (last 30 days)
        supabase
          .from('monthly_billing_transactions')
          .select(`
            id,
            amount,
            billing_date,
            user_id,
            campaign_id,
            created_at
          `)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      console.log('🔍 Query responses:');
      console.log('- Transactions response:', transactionsResponse);
      console.log('- Recent bookings response:', recentBookingsResponse);
      console.log('- Recent points transactions response:', recentPointsTransactionsResponse);
      console.log('- Recent points transactions data:', recentPointsTransactionsResponse.data);

      // Process stats from admin function
      const adminStatsData = adminStats as { 
        total_users: number; 
        active_consultants: number; 
        active_services: number; 
        active_bookings: number; 
      };
      
      const totalUsers = adminStatsData.total_users || 0;
      const activeConsultants = adminStatsData.active_consultants || 0;
      const activeServices = adminStatsData.active_services || 0;
      const activeBookings = adminStatsData.active_bookings || 0;
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

      // Add user IDs from campaign data
      recentCampaignsCreatedResponse.data?.forEach(campaign => {
        userIds.add(campaign.created_by);
      });

      recentCampaignParticipationsResponse.data?.forEach(participation => {
        userIds.add(participation.user_id);
      });

      recentPointsTransactionsResponse.data?.forEach(transaction => {
        userIds.add(transaction.user_id);
      });

      recentMonthlyBillingResponse.data?.forEach(billing => {
        userIds.add(billing.user_id);
      });

      // Fetch profiles for users and consultants
      console.log('🔍 Fetching profiles for user IDs:', Array.from(userIds));
      const [userProfiles, consultantProfiles] = await Promise.all([
        userIds.size > 0 ? supabase
          .from('profiles')
          .select('user_id, full_name, email')
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
      console.log('👥 User profiles fetched:', userProfiles.data?.length);
      userProfiles.data?.forEach(p => {
        if (p.user_id) {
          const nameFromFull = toFirstName(p.full_name);
          const nameFromEmail = toFirstName(p.email);
          const displayName = nameFromFull || nameFromEmail || 'user';
          userProfileMap.set(p.user_id, displayName);
          console.log('📝 Mapped user:', p.user_id, '->', displayName);
        }
      });

      // Fallback: fetch from user_accounts for users without a profile row
      const missingUserIds = Array.from(userIds).filter((id) => !userProfileMap.has(id));
      if (missingUserIds.length > 0) {
        const accountsRes = await supabase
          .from('user_accounts')
          .select('user_id, full_name, email')
          .in('user_id', missingUserIds);
        if (accountsRes.data) {
          accountsRes.data.forEach((a: any) => {
            if (a.user_id && !userProfileMap.has(a.user_id)) {
              const nameFromFull = toFirstName(a.full_name);
              const nameFromEmail = toFirstName(a.email);
              const displayName = nameFromFull || nameFromEmail || 'user';
              userProfileMap.set(a.user_id, displayName);
              console.log('🧾 Fallback mapped from user_accounts:', a.user_id, '->', displayName);
            }
          });
        } else if (accountsRes.error) {
          console.warn('⚠️ user_accounts fetch error:', accountsRes.error.message);
        }
      }

      const consultantProfileMap = new Map<string, string>();
      consultantProfiles.data?.forEach(c => {
        if (c.id && c.profile?.full_name) {
          consultantProfileMap.set(c.id, c.profile.full_name);
        }
      });

      // Add recent bookings
      recentBookingsResponse.data?.forEach(booking => {
        const userName = userProfileMap.get(booking.user_id) || 'user';
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

      // Add recent services
      recentServicesResponse.data?.forEach(service => {
        const consultantName = consultantProfileMap.get(service.consultant_id) || 'Consultant';
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

      // Add recent completions
      recentCompletionsResponse.data?.forEach(booking => {
        const consultantName = consultantProfileMap.get(booking.consultant_id) || 'consultant';
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

      // Add recent campaign creations
      recentCampaignsCreatedResponse.data?.forEach(campaign => {
        const creatorName = userProfileMap.get(campaign.created_by) || 'Admin';
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

      // Add recent campaign participations
      recentCampaignParticipationsResponse.data?.forEach(participation => {
        const userName = participation.consultant_name || userProfileMap.get(participation.user_id) || 'user';
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

      // Add recent points transactions with enhanced categorization
      console.log('💳 Processing points/credit transactions:', recentPointsTransactionsResponse.data?.length, 'transactions');
      recentPointsTransactionsResponse.data?.forEach(transaction => {
        console.log('📊 Processing transaction:', transaction);
        console.log('🔍 Looking up user:', transaction.user_id, 'in map:', userProfileMap.has(transaction.user_id));
        const userName = userProfileMap.get(transaction.user_id) || 'user';
        let activityType: RecentActivity['type'] = 'wallet_topup';
        let description = '';
        let category: RecentActivity['category'] = 'credit';
        let emoji = '💰';
        
        // Enhanced transaction type detection
        const isServicePurchase = transaction.booking_id !== null;
        const isCampaignRelated = transaction.description?.toLowerCase().includes('campaign') || 
                                   transaction.description?.toLowerCase().includes('lead generation') ||
                                   transaction.description?.toLowerCase().includes('facebook ads');
        const isSubscriptionRelated = transaction.description?.toLowerCase().includes('subscription') ||
                                       transaction.description?.toLowerCase().includes('plan upgrade') ||
                                       transaction.description?.toLowerCase().includes('downgrade');
        const isAdminAction = transaction.description?.toLowerCase().includes('admin');
        const isStripePayment = transaction.description?.toLowerCase().includes('stripe') ||
                                 transaction.description?.toLowerCase().includes('payment intent');
        
        switch (transaction.type) {
          case 'purchase':
            category = 'debit';
            if (isServicePurchase) {
              activityType = 'service_purchase';
              description = `${userName} purchased service for ${Math.abs(transaction.amount)} points`;
              emoji = '🛒';
            } else if (isCampaignRelated) {
              activityType = 'campaign_purchase';
              description = `${userName} invested ${Math.abs(transaction.amount)} points in ad campaign`;
              emoji = '📈';
            } else if (isStripePayment) {
              activityType = 'stripe_payment';
              description = `${userName} purchased ${Math.abs(transaction.amount)} credits via Stripe`;
              category = 'credit';
              emoji = '💳';
            } else {
              activityType = 'manual_adjustment';
              description = `${userName} spent ${Math.abs(transaction.amount)} points`;
              emoji = '💸';
            }
            break;
            
          case 'refund':
            if (isAdminAction && transaction.amount < 0) {
              activityType = 'admin_debit';
              description = `Admin deducted ${Math.abs(transaction.amount)} credits from ${userName}`;
              category = 'debit';
              emoji = '🔻';
            } else {
              activityType = 'refund';
              description = `${Math.abs(transaction.amount)} points refunded to ${userName}`;
              category = 'credit';
              emoji = '↩️';
            }
            break;
            
          case 'admin_credit':
            activityType = 'admin_credit';
            description = `Admin credited ${Math.abs(transaction.amount)} credits to ${userName}`;
            const reason = transaction.description?.replace('Admin credit - ', '').replace(/flexi credits added by admin: /, '');
            if (reason && reason !== 'nil' && reason !== 'no reason') {
              description += ` (${reason})`;
            }
            emoji = '🔝';
            break;
            
          case 'initial_credit':
            activityType = 'wallet_topup';
            description = `${userName} received ${Math.abs(transaction.amount)} welcome credits`;
            emoji = '🎉';
            break;
            
          case 'earning':
            if (transaction.description?.toLowerCase().includes('referral')) {
              activityType = 'referral_bonus';
              description = `${userName} earned ${Math.abs(transaction.amount)} referral bonus`;
              emoji = '🤝';
            } else if (transaction.description?.toLowerCase().includes('commission')) {
              activityType = 'commission_payment';
              description = `${userName} received ${Math.abs(transaction.amount)} commission`;
              emoji = '💼';
            } else {
              activityType = 'wallet_topup';
              description = `${userName} earned ${Math.abs(transaction.amount)} points`;
              emoji = '⭐';
            }
            break;
            
          default:
            // Handle subscription-related transactions
            if (isSubscriptionRelated) {
              if (transaction.description?.toLowerCase().includes('upgrade')) {
                activityType = 'subscription_upgrade';
                description = `${userName} upgraded subscription (+${Math.abs(transaction.amount)} credits)`;
                category = 'subscription';
                emoji = '⬆️';
              } else if (transaction.description?.toLowerCase().includes('downgrade')) {
                activityType = 'subscription_downgrade';
                description = `${userName} scheduled subscription downgrade`;
                category = 'subscription';
                emoji = '⬇️';
              } else if (transaction.description?.toLowerCase().includes('proration')) {
                activityType = 'proration_credit';
                description = `${userName} received ${Math.abs(transaction.amount)} proration credit`;
                category = 'subscription';
                emoji = '⚖️';
              }
            } else {
              activityType = 'manual_adjustment';
              description = `${userName} - ${transaction.type}: ${Math.abs(transaction.amount)} points`;
              emoji = '🔧';
            }
        }

        activities.push({
          id: `points-${transaction.id}`,
          type: activityType,
          description,
          points: Math.abs(transaction.amount),
          timestamp: formatTimestamp(transaction.created_at),
          rawTimestamp: transaction.created_at,
          category,
          emoji,
        });
      });

      // Add recent monthly billing transactions
      recentMonthlyBillingResponse.data?.forEach(billing => {
        const userName = userProfileMap.get(billing.user_id) || 'User';
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

      // Sort by raw timestamp and take top 50 for better coverage
      const sortedActivities = activities
        .sort((a, b) => new Date(b.rawTimestamp).getTime() - new Date(a.rawTimestamp).getTime())
        .slice(0, 50);

      console.log('📈 Final activities count:', sortedActivities.length);
      console.log('📈 Final activities:', sortedActivities);

      setRecentActivity(sortedActivities);
      setFilteredActivity(sortedActivities);

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

  const filterActivities = (filter: string) => {
    setActiveFilter(filter);
    if (filter === "all") {
      setFilteredActivity(recentActivity);
    } else {
      const filtered = recentActivity.filter(activity => activity.category === filter);
      setFilteredActivity(filtered);
    }
  };

  return {
    stats,
    recentActivity: filteredActivity,
    allActivity: recentActivity,
    activeFilter,
    filterActivities,
    loading,
    error,
    refreshData: fetchAdminData,
  };
}