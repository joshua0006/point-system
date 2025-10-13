// Campaign Analytics Mock Data Utility
// Provides comprehensive sample analytics data for campaign dashboards

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface TimeSeriesDataPoint {
  date: string;
  leads: number;
  conversions: number;
  spend: number;
  clicks?: number;
  impressions?: number;
}

export interface LeadSource {
  source: string;
  leads: number;
  conversions: number;
  conversionRate: number;
  percentage: number;
}

export interface GeographicData {
  location: string;
  leads: number;
  conversions: number;
  percentage: number;
}

export interface PerformanceMetrics {
  totalLeads: number;
  totalConversions: number;
  conversionRate: number;
  totalSpend: number;
  costPerLead: number;
  costPerConversion: number;
  roi: number;
  avgDailyLeads: number;
  avgDailyConversions: number;
}

export interface TrendData {
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
}

export interface PeakPerformance {
  bestDay: { day: string; leads: number };
  bestHour: { hour: string; leads: number };
  worstDay: { day: string; leads: number };
}

export interface CampaignGoals {
  leadGoal: number;
  leadProgress: number;
  conversionGoal: number;
  conversionProgress: number;
  budgetGoal: number;
  budgetUsed: number;
}

export interface CampaignAnalytics {
  campaignId: string;
  campaignName: string;
  campaignType: 'facebook' | 'cold-calling' | 'va-support';
  dateRange: {
    startDate: string;
    endDate: string;
  };
  performance: PerformanceMetrics;
  timeSeries: TimeSeriesDataPoint[];
  leadSources: LeadSource[];
  geographic: GeographicData[];
  trends: TrendData[];
  peakPerformance: PeakPerformance;
  goals: CampaignGoals;
}

// ============================================================================
// Data Generator Functions
// ============================================================================

/**
 * Generates a random number within a range
 */
const randomInRange = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generates a date string for X days ago
 */
const getDaysAgo = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

/**
 * Generates time series data for the past 30 days
 */
const generateTimeSeriesData = (
  campaignType: 'facebook' | 'cold-calling' | 'va-support'
): TimeSeriesDataPoint[] => {
  const data: TimeSeriesDataPoint[] = [];

  // Base metrics vary by campaign type
  const baseMetrics = {
    facebook: { leads: [10, 30], conversions: [2, 8], spend: [50, 150] },
    'cold-calling': { leads: [5, 15], conversions: [2, 7], spend: [30, 90] },
    'va-support': { leads: [3, 10], conversions: [1, 5], spend: [40, 120] }
  };

  const metrics = baseMetrics[campaignType];

  for (let i = 29; i >= 0; i--) {
    const date = getDaysAgo(i);
    const leads = randomInRange(metrics.leads[0], metrics.leads[1]);
    const conversions = randomInRange(
      Math.max(1, Math.floor(leads * 0.15)),
      Math.floor(leads * 0.4)
    );
    const spend = randomInRange(metrics.spend[0], metrics.spend[1]);

    data.push({
      date,
      leads,
      conversions,
      spend,
      ...(campaignType === 'facebook' && {
        clicks: randomInRange(leads * 5, leads * 10),
        impressions: randomInRange(leads * 50, leads * 100)
      })
    });
  }

  return data;
};

/**
 * Generates lead source breakdown data
 */
const generateLeadSources = (
  campaignType: 'facebook' | 'cold-calling' | 'va-support'
): LeadSource[] => {
  const sourcesByType = {
    facebook: [
      { source: 'Facebook Ads', percentage: 65 },
      { source: 'Instagram', percentage: 20 },
      { source: 'Messenger', percentage: 10 },
      { source: 'Audience Network', percentage: 5 }
    ],
    'cold-calling': [
      { source: 'Cold Outreach', percentage: 70 },
      { source: 'Warm Leads', percentage: 20 },
      { source: 'Referrals', percentage: 10 }
    ],
    'va-support': [
      { source: 'Admin Support', percentage: 40 },
      { source: 'Customer Service', percentage: 35 },
      { source: 'Data Entry', percentage: 15 },
      { source: 'Research', percentage: 10 }
    ]
  };

  const sources = sourcesByType[campaignType];
  const totalLeads = randomInRange(200, 500);

  return sources.map(s => {
    const leads = Math.floor(totalLeads * (s.percentage / 100));
    const conversions = Math.floor(leads * randomInRange(15, 35) / 100);
    return {
      source: s.source,
      leads,
      conversions,
      conversionRate: parseFloat(((conversions / leads) * 100).toFixed(1)),
      percentage: s.percentage
    };
  });
};

/**
 * Generates geographic distribution data
 */
const generateGeographicData = (): GeographicData[] => {
  const locations = [
    'California',
    'Texas',
    'New York',
    'Florida',
    'Illinois',
    'Pennsylvania',
    'Ohio',
    'Georgia'
  ];

  const totalLeads = randomInRange(200, 500);
  const data: GeographicData[] = [];

  // Generate percentages that add up to 100
  let remainingPercentage = 100;

  locations.slice(0, 5).forEach((location, index) => {
    const isLast = index === 4;
    const percentage = isLast
      ? remainingPercentage
      : randomInRange(10, remainingPercentage - (10 * (4 - index)));

    remainingPercentage -= percentage;
    const leads = Math.floor(totalLeads * (percentage / 100));
    const conversions = Math.floor(leads * randomInRange(15, 35) / 100);

    data.push({
      location,
      leads,
      conversions,
      percentage
    });
  });

  return data.sort((a, b) => b.leads - a.leads);
};

/**
 * Calculates performance metrics from time series data
 */
const calculatePerformanceMetrics = (
  timeSeries: TimeSeriesDataPoint[]
): PerformanceMetrics => {
  const totalLeads = timeSeries.reduce((sum, day) => sum + day.leads, 0);
  const totalConversions = timeSeries.reduce((sum, day) => sum + day.conversions, 0);
  const totalSpend = timeSeries.reduce((sum, day) => sum + day.spend, 0);

  return {
    totalLeads,
    totalConversions,
    conversionRate: parseFloat(((totalConversions / totalLeads) * 100).toFixed(1)),
    totalSpend,
    costPerLead: parseFloat((totalSpend / totalLeads).toFixed(2)),
    costPerConversion: parseFloat((totalSpend / totalConversions).toFixed(2)),
    roi: parseFloat((((totalConversions * 100) - totalSpend) / totalSpend * 100).toFixed(1)),
    avgDailyLeads: parseFloat((totalLeads / timeSeries.length).toFixed(1)),
    avgDailyConversions: parseFloat((totalConversions / timeSeries.length).toFixed(1))
  };
};

/**
 * Generates trend comparison data (current vs previous period)
 */
const generateTrendData = (
  performance: PerformanceMetrics
): TrendData[] => {
  const generateTrend = (metric: string, current: number): TrendData => {
    const change = randomInRange(-20, 30);
    const previous = current - (current * change / 100);

    return {
      metric,
      current,
      previous: parseFloat(previous.toFixed(2)),
      change: parseFloat((current - previous).toFixed(2)),
      changePercentage: parseFloat(change.toFixed(1))
    };
  };

  return [
    generateTrend('Leads', performance.totalLeads),
    generateTrend('Conversions', performance.totalConversions),
    generateTrend('Conversion Rate', performance.conversionRate),
    generateTrend('Cost per Lead', performance.costPerLead)
  ];
};

/**
 * Identifies peak performance times
 */
const generatePeakPerformance = (
  timeSeries: TimeSeriesDataPoint[]
): PeakPerformance => {
  const sortedByLeads = [...timeSeries].sort((a, b) => b.leads - a.leads);
  const bestDay = sortedByLeads[0];
  const worstDay = sortedByLeads[sortedByLeads.length - 1];

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hours = ['9 AM', '10 AM', '11 AM', '2 PM', '3 PM', '4 PM'];

  return {
    bestDay: {
      day: new Date(bestDay.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      leads: bestDay.leads
    },
    bestHour: {
      hour: hours[randomInRange(0, hours.length - 1)],
      leads: randomInRange(5, 15)
    },
    worstDay: {
      day: new Date(worstDay.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      leads: worstDay.leads
    }
  };
};

/**
 * Generates campaign goal tracking data
 */
const generateCampaignGoals = (
  performance: PerformanceMetrics
): CampaignGoals => {
  return {
    leadGoal: Math.floor(performance.totalLeads * 1.25),
    leadProgress: parseFloat(((performance.totalLeads / (performance.totalLeads * 1.25)) * 100).toFixed(1)),
    conversionGoal: Math.floor(performance.totalConversions * 1.3),
    conversionProgress: parseFloat(((performance.totalConversions / (performance.totalConversions * 1.3)) * 100).toFixed(1)),
    budgetGoal: Math.floor(performance.totalSpend * 1.15),
    budgetUsed: performance.totalSpend
  };
};

// ============================================================================
// Main Generator Function
// ============================================================================

/**
 * Generates comprehensive mock analytics data for a campaign
 * @param campaignId - The unique campaign identifier
 * @param campaignName - The name of the campaign
 * @param campaignType - The type of campaign (facebook, cold-calling, va-support)
 * @returns Complete analytics data structure
 */
export const generateMockAnalytics = (
  campaignId: string,
  campaignName: string,
  campaignType: 'facebook' | 'cold-calling' | 'va-support'
): CampaignAnalytics => {
  const timeSeries = generateTimeSeriesData(campaignType);
  const performance = calculatePerformanceMetrics(timeSeries);

  return {
    campaignId,
    campaignName,
    campaignType,
    dateRange: {
      startDate: getDaysAgo(29),
      endDate: getDaysAgo(0)
    },
    performance,
    timeSeries,
    leadSources: generateLeadSources(campaignType),
    geographic: generateGeographicData(),
    trends: generateTrendData(performance),
    peakPerformance: generatePeakPerformance(timeSeries),
    goals: generateCampaignGoals(performance)
  };
};

// ============================================================================
// Pre-generated Sample Data Sets
// ============================================================================

export const sampleFacebookCampaignAnalytics = generateMockAnalytics(
  'sample-facebook-1',
  'Facebook Lead Generation - Real Estate',
  'facebook'
);

export const sampleColdCallingCampaignAnalytics = generateMockAnalytics(
  'sample-cold-calling-1',
  'Cold Calling Campaign - B2B Services',
  'cold-calling'
);

export const sampleVASupportCampaignAnalytics = generateMockAnalytics(
  'sample-va-support-1',
  'Virtual Assistant Support - Admin',
  'va-support'
);

/**
 * Helper function to get campaign type from campaign name
 */
export const getCampaignTypeFromName = (campaignName: string): 'facebook' | 'cold-calling' | 'va-support' => {
  const name = campaignName.toLowerCase();
  if (name.includes('facebook') || name.includes('fb')) return 'facebook';
  if (name.includes('cold calling') || name.includes('calling')) return 'cold-calling';
  if (name.includes('va support') || name.includes('virtual assistant')) return 'va-support';
  return 'facebook'; // default
};
