// Normalize to first name (lowercase)
export const toFirstName = (value?: string | null): string | null => {
  if (!value) return null;
  const base = value.includes('@') ? value.split('@')[0] : value;
  const first = base.trim().split(/\s+/)[0];
  return first.toLowerCase();
};

// Format timestamp for display
export const formatTimestamp = (timestamp: string): string => {
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

// Get current month start date
export const getCurrentMonthStart = (): string => {
  return new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
};

// Get date N days ago
export const getDaysAgo = (days: number): string => {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
};

// Create lookup map from profiles
export const createUserProfileMap = (profiles: any[]): Map<string, string> => {
  const map = new Map<string, string>();
  profiles.forEach(p => {
    if (p.user_id) {
      const nameFromFull = toFirstName(p.full_name);
      const nameFromEmail = toFirstName(p.email);
      const displayName = nameFromFull || nameFromEmail || 'user';
      map.set(p.user_id, displayName);
    }
  });
  return map;
};

// Create consultant profile map
export const createConsultantProfileMap = (consultants: any[]): Map<string, string> => {
  const map = new Map<string, string>();
  consultants.forEach(c => {
    if (c.id && c.profile?.full_name) {
      map.set(c.id, c.profile.full_name);
    }
  });
  return map;
};

// Extract unique IDs from data arrays
export const extractUserIds = (...dataArrays: any[][]): Set<string> => {
  const userIds = new Set<string>();
  dataArrays.forEach(array => {
    array?.forEach(item => {
      if (item.user_id) userIds.add(item.user_id);
      if (item.created_by) userIds.add(item.created_by);
    });
  });
  return userIds;
};

export const extractConsultantIds = (...dataArrays: any[][]): Set<string> => {
  const consultantIds = new Set<string>();
  dataArrays.forEach(array => {
    array?.forEach(item => {
      if (item.consultant_id) consultantIds.add(item.consultant_id);
    });
  });
  return consultantIds;
};

// Sort activities by timestamp
export const sortActivitiesByTimestamp = (activities: any[]): any[] => {
  return activities.sort((a, b) => 
    new Date(b.rawTimestamp).getTime() - new Date(a.rawTimestamp).getTime()
  );
};

// Filter activities by category
export const filterActivitiesByCategory = (activities: any[], category: string): any[] => {
  if (category === "all") return activities;
  return activities.filter(activity => activity.category === category);
};

// Get activity category styles
export const getActivityCategoryStyles = (category: string): string => {
  switch (category) {
    case 'credit':
      return 'bg-success/10 text-success border-success/20';
    case 'debit':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'campaign':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'subscription':
      return 'bg-accent/10 text-accent-foreground border-accent/20';
    case 'booking':
      return 'bg-warning/10 text-warning-foreground border-warning/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

// Determine transaction context
export const getTransactionContext = (transaction: any) => {
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

  return {
    isServicePurchase,
    isCampaignRelated,
    isSubscriptionRelated,
    isAdminAction,
    isStripePayment
  };
};