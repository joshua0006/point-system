
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ModeProvider } from "@/contexts/ModeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Suspense, lazy } from "react";
import { PageSkeleton, DashboardSkeleton } from "@/components/PageSkeleton";

// Lazy load all pages for optimal performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));
const ConsultantDashboard = lazy(() => import("./pages/ConsultantDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Services = lazy(() => import("./pages/Services"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const FacebookAdsCampaigns = lazy(() => import("./pages/FacebookAdsCampaigns"));
const ColdCallingCampaigns = lazy(() => import("./pages/ColdCallingCampaigns"));
const VASupportCampaigns = lazy(() => import("./pages/VASupportCampaigns"));
const Gifting = lazy(() => import("./pages/Gifting"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));

const ConsultantProfile = lazy(() => import("./pages/ConsultantProfile"));
const BuyerProfile = lazy(() => import("./pages/BuyerProfile"));
const SellerProfile = lazy(() => import("./pages/SellerProfile"));
const LeadGenCampaigns = lazy(() => import("./pages/LeadGenCampaigns"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const AdCopyGenerator = lazy(() => import("./pages/AdCopyGenerator"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Optimized query client with better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error) => {
        if (failureCount < 2 && error?.message !== 'Network Error') {
          return true;
        }
        return false;
      },
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ModeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={
                <Suspense fallback={<PageSkeleton />}>
                  <Auth />
                </Suspense>
              } />
              
              {/* All other routes are protected */}
              <Route path="/" element={
                <Suspense fallback={<PageSkeleton />}>
                  <ProtectedRoute><Index /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/dashboard" element={
                <Suspense fallback={<DashboardSkeleton />}>
                  <ProtectedRoute><UserDashboard /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/seller-dashboard" element={
                <Suspense fallback={<DashboardSkeleton />}>
                  <ProtectedRoute><SellerDashboard /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/consultant-dashboard" element={
                <Suspense fallback={<DashboardSkeleton />}>
                  <ProtectedRoute><ConsultantDashboard /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/admin-dashboard" element={
                <Suspense fallback={<DashboardSkeleton />}>
                  <ProtectedRoute><AdminDashboard /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/marketplace" element={
                <Suspense fallback={<PageSkeleton />}>
                  <ProtectedRoute><Marketplace /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/services" element={
                <Suspense fallback={<PageSkeleton />}>
                  <ProtectedRoute><Services /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/campaigns" element={
                <Suspense fallback={<PageSkeleton />}>
                  <ProtectedRoute><Campaigns /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/campaigns/facebook-ads" element={
                <Suspense fallback={<PageSkeleton />}>
                  <ProtectedRoute><FacebookAdsCampaigns /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/campaigns/cold-calling" element={
                <Suspense fallback={<PageSkeleton />}>
                  <ProtectedRoute><ColdCallingCampaigns /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/campaigns/va-support" element={
                <Suspense fallback={<PageSkeleton />}>
                  <ProtectedRoute><VASupportCampaigns /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/gifting" element={
                <Suspense fallback={<PageSkeleton />}>
                  <ProtectedRoute><Gifting /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/service/:serviceId" element={
                <Suspense fallback={<PageSkeleton />}>
                  <ProtectedRoute><ServiceDetail /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/consultant/:userId" element={
                <Suspense fallback={<PageSkeleton />}>
                  <ProtectedRoute><ConsultantProfile /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/buyer/:userId" element={
                <Suspense fallback={<PageSkeleton />}>
                  <ProtectedRoute><BuyerProfile /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/profile/consultant/:userId" element={
                <Suspense fallback={<PageSkeleton />}>
                  <ProtectedRoute><ConsultantProfile /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/profile/buyer/:userId" element={
                <Suspense fallback={<PageSkeleton />}>
                  <ProtectedRoute><BuyerProfile /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/profile/seller/:userId" element={
                <Suspense fallback={<PageSkeleton />}>
                  <ProtectedRoute><SellerProfile /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/lead-gen-campaigns" element={
                <Suspense fallback={<PageSkeleton />}>
                  <ProtectedRoute><LeadGenCampaigns /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/ai-assistant" element={
                <Suspense fallback={<PageSkeleton />}>
                  <ProtectedRoute><AIAssistant /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/ad-copy-generator" element={
                <Suspense fallback={<PageSkeleton />}>
                  <ProtectedRoute><AdCopyGenerator /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/settings" element={
                <Suspense fallback={<PageSkeleton />}>
                  <ProtectedRoute><Settings /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="*" element={
                <Suspense fallback={<PageSkeleton />}>
                  <ProtectedRoute><NotFound /></ProtectedRoute>
                </Suspense>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ModeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
