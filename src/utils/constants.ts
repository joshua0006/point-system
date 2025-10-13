// Application constants
export const APP_CONFIG = {
  name: 'AgentHub',
  shortName: 'Hub',
  description: 'Marketing campaigns and client gifting platform',
  version: '2.0.0',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  profiles: '/profiles',
  services: '/services',
  bookings: '/bookings',
  campaigns: '/campaigns',
  transactions: '/flexi_credits_transactions',
} as const;

// Query keys for React Query
export const QUERY_KEYS = {
  profile: ['profile'],
  subscription: ['subscription'],
  services: ['services'],
  bookings: ['bookings'],
  campaigns: ['campaigns'],
  transactions: ['transactions'],
  dashboardStats: ['dashboardStats'],
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  theme: 'theme',
  selectedMode: 'selectedMode',
  onboardingCompleted: 'onboardingCompleted',
} as const;

// Default values
export const DEFAULTS = {
  pageSize: 10,
  debounceDelay: 300,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
} as const;

// Validation rules
export const VALIDATION = {
  minPasswordLength: 8,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
} as const;