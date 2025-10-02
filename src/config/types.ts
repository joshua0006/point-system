import { ComponentType } from 'react';
import { LucideIcon } from 'lucide-react';

// User and Role Types
export type UserRole = 'user' | 'consultant' | 'admin' | 'master_admin' | 'sales';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  flexi_credits_balance: number;
  gifting_credits_balance: number;
  created_at: string;
  updated_at: string;
  bio: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  couple_id: string | null;
  partner_name: string | null;
  onboarding_completed: boolean;
}

export interface UserProfile extends Profile {
  // Alias for admin components
}

// Campaign Target Interface
export interface CampaignTarget {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  campaignTypes: string[];
  created_at: string;
  updated_at: string;
}

// Navigation Types
export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
  hasNotification?: boolean;
  children?: NavItem[];
}

// Route Configuration Types
export interface RouteConfig {
  path: string;
  component: ComponentType;
  protected?: boolean;
  skeleton?: ComponentType;
  exact?: boolean;
}

// Campaign Types
export interface CampaignData {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: number;
  target_audience: string;
  created_at: string;
  updated_at: string;
}

// Transaction Types
export interface Transaction {
  id: string;
  type: 'spent' | 'earned' | 'refund' | 'bonus';
  amount: number;
  description: string;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  service?: string;
  consultant?: string;
}

// Service Types
export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  duration_minutes: number | null;
  image_url: string | null;
  consultant_id: string;
  category_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Modal Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// API Response Types
export interface ApiResponse<T = any> {
  data: T;
  error?: string;
  message?: string;
}

// Dashboard Stats Types
export interface DashboardStats {
  totalBalance: number;
  totalSpent: number;
  servicesBooked: number;
  completionRate: number;
  upcomingSessions: number;
}