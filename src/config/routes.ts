import { lazy } from 'react';
import { RouteConfig } from './types';
import { PageSkeleton, DashboardSkeleton } from '@/components/PageSkeleton';

// Lazy load all pages for optimal performance
const Index = lazy(() => import('@/pages/Index'));
const Auth = lazy(() => import('@/pages/Auth'));
const UserDashboard = lazy(() => import('@/pages/UserDashboard'));
const SellerDashboard = lazy(() => import('@/pages/SellerDashboard'));
const ConsultantDashboard = lazy(() => import('@/pages/ConsultantDashboard'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const Marketplace = lazy(() => import('@/pages/Marketplace'));
const Services = lazy(() => import('@/pages/Services'));
const Campaigns = lazy(() => import('@/pages/Campaigns'));
const CampaignLaunch = lazy(() => import('@/pages/CampaignLaunch'));
const MyCampaigns = lazy(() => import('@/pages/MyCampaigns'));
const FacebookAdsCampaigns = lazy(() => import('@/pages/FacebookAdsCampaigns'));
const ColdCallingCampaigns = lazy(() => import('@/pages/ColdCallingCampaigns'));
const VASupportCampaigns = lazy(() => import('@/pages/VASupportCampaigns'));
const Gifting = lazy(() => import('@/pages/Gifting'));
const ServiceDetail = lazy(() => import('@/pages/ServiceDetail'));
const ConsultantProfile = lazy(() => import('@/pages/ConsultantProfile'));
const BuyerProfile = lazy(() => import('@/pages/BuyerProfile'));
const SellerProfile = lazy(() => import('@/pages/SellerProfile'));
const AIAssistant = lazy(() => import('@/pages/AIAssistant'));
const AdCopyGenerator = lazy(() => import('@/pages/AdCopyGenerator'));
const Settings = lazy(() => import('@/pages/Settings'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export const routeConfig: RouteConfig[] = [
  {
    path: '/auth',
    component: Auth,
    protected: false,
    skeleton: PageSkeleton,
  },
  {
    path: '/',
    component: Index,
    protected: true,
    skeleton: PageSkeleton,
    exact: true,
  },
  {
    path: '/dashboard',
    component: UserDashboard,
    protected: true,
    skeleton: DashboardSkeleton,
  },
  {
    path: '/seller-dashboard',
    component: SellerDashboard,
    protected: true,
    skeleton: DashboardSkeleton,
  },
  {
    path: '/consultant-dashboard',
    component: ConsultantDashboard,
    protected: true,
    skeleton: DashboardSkeleton,
  },
  {
    path: '/admin-dashboard',
    component: AdminDashboard,
    protected: true,
    skeleton: DashboardSkeleton,
  },
  {
    path: '/marketplace',
    component: Marketplace,
    protected: true,
    skeleton: PageSkeleton,
  },
  {
    path: '/services',
    component: Services,
    protected: true,
    skeleton: PageSkeleton,
  },
  {
    path: '/campaigns',
    component: Campaigns,
    protected: true,
    skeleton: PageSkeleton,
  },
  {
    path: '/campaigns/launch',
    component: CampaignLaunch,
    protected: true,
    skeleton: PageSkeleton,
  },
  {
    path: '/campaigns/my-campaigns',
    component: MyCampaigns,
    protected: true,
    skeleton: PageSkeleton,
  },
  {
    path: '/campaigns/facebook-ads',
    component: FacebookAdsCampaigns,
    protected: true,
    skeleton: PageSkeleton,
  },
  {
    path: '/campaigns/cold-calling',
    component: ColdCallingCampaigns,
    protected: true,
    skeleton: PageSkeleton,
  },
  {
    path: '/campaigns/va-support',
    component: VASupportCampaigns,
    protected: true,
    skeleton: PageSkeleton,
  },
  {
    path: '/gifting',
    component: Gifting,
    protected: true,
    skeleton: PageSkeleton,
  },
  {
    path: '/service/:serviceId',
    component: ServiceDetail,
    protected: true,
    skeleton: PageSkeleton,
  },
  {
    path: '/consultant/:userId',
    component: ConsultantProfile,
    protected: true,
    skeleton: PageSkeleton,
  },
  {
    path: '/buyer/:userId',
    component: BuyerProfile,
    protected: true,
    skeleton: PageSkeleton,
  },
  {
    path: '/profile/consultant/:userId',
    component: ConsultantProfile,
    protected: true,
    skeleton: PageSkeleton,
  },
  {
    path: '/profile/buyer/:userId',
    component: BuyerProfile,
    protected: true,
    skeleton: PageSkeleton,
  },
  {
    path: '/profile/seller/:userId',
    component: SellerProfile,
    protected: true,
    skeleton: PageSkeleton,
  },
  {
    path: '/ai-assistant',
    component: AIAssistant,
    protected: true,
    skeleton: PageSkeleton,
  },
  {
    path: '/ad-copy-generator',
    component: AdCopyGenerator,
    protected: true,
    skeleton: PageSkeleton,
  },
  {
    path: '/settings/:tab?',
    component: Settings,
    protected: true,
    skeleton: PageSkeleton,
  },
  {
    path: '*',
    component: NotFound,
    protected: true,
    skeleton: PageSkeleton,
  },
];