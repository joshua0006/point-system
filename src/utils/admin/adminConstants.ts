export const ACTIVITY_FILTERS = [
  { key: "all", label: "All", icon: "🔍" },
  { key: "credit", label: "Credits", icon: "💰" },
  { key: "debit", label: "Debits", icon: "💸" },
  { key: "campaign", label: "Campaigns", icon: "🎯" },
  { key: "subscription", label: "Subscriptions", icon: "📋" },
  { key: "booking", label: "Bookings", icon: "📅" },
  { key: "system", label: "System", icon: "🔧" },
] as const;

export const ACTIVITY_CATEGORIES = {
  CREDIT: 'credit',
  DEBIT: 'debit',
  CAMPAIGN: 'campaign',
  SUBSCRIPTION: 'subscription',
  BOOKING: 'booking',
  SYSTEM: 'system'
} as const;

export const ACTIVITY_TYPES = {
  booking: 'booking',
  service: 'service',
  completion: 'completion',
  campaign: 'campaign',
  campaign_created: 'campaign_created',
  campaign_joined: 'campaign_joined',
  wallet_topup: 'wallet_topup',
  campaign_purchase: 'campaign_purchase',
  service_purchase: 'service_purchase',
  points_deducted: 'points_deducted',
  monthly_billing: 'monthly_billing',
  campaign_status_change: 'campaign_status_change',
  admin_credit: 'admin_credit',
  admin_debit: 'admin_debit',
  subscription_upgrade: 'subscription_upgrade',
  subscription_downgrade: 'subscription_downgrade',
  subscription_cancelled: 'subscription_cancelled',
  proration_credit: 'proration_credit',
  referral_bonus: 'referral_bonus',
  commission_payment: 'commission_payment',
  manual_adjustment: 'manual_adjustment',
  refund: 'refund',
  payment_failed: 'payment_failed',
  stripe_payment: 'stripe_payment'
} as const;

export const REALTIME_CHANNELS = {
  ADMIN_FLEXI_CREDITS: 'admin-flexi-credits',
  ADMIN_BOOKINGS: 'admin-bookings',
  ADMIN_CAMPAIGNS: 'admin-campaigns'
} as const;

export const REALTIME_TABLES = {
  FLEXI_CREDITS_TRANSACTIONS: 'flexi_credits_transactions',
  BOOKINGS: 'bookings',
  LEAD_GEN_CAMPAIGNS: 'lead_gen_campaigns'
} as const;

export const DAYS_RANGE = {
  RECENT_ACTIVITY: 30,
  MONTHLY_VOLUME: 'current_month'
} as const;

export const LIMITS = {
  RECENT_ACTIVITIES: 50,
  POINTS_TRANSACTIONS: 100,
  QUERY_BATCH_SIZE: 50
} as const;

export type ActivityFilterKey = typeof ACTIVITY_FILTERS[number]['key'];
export type ActivityCategory = typeof ACTIVITY_CATEGORIES[keyof typeof ACTIVITY_CATEGORIES];
export type ActivityType = keyof typeof ACTIVITY_TYPES;