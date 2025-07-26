
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ModeProvider } from "@/contexts/ModeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import UserDashboard from "./pages/UserDashboard";
import SellerDashboard from "./pages/SellerDashboard";
import ConsultantDashboard from "./pages/ConsultantDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Marketplace from "./pages/Marketplace";
import ServiceDetail from "./pages/ServiceDetail";
import Messages from "./pages/Messages";
import ConsultantProfile from "./pages/ConsultantProfile";
import BuyerProfile from "./pages/BuyerProfile";
import SellerProfile from "./pages/SellerProfile";
import LeadGenCampaigns from "./pages/LeadGenCampaigns";
import CampaignPreview from "./pages/CampaignPreview";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ModeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller-dashboard"
                element={
                  <ProtectedRoute>
                    <SellerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/consultant-dashboard"
                element={
                  <ProtectedRoute>
                    <ConsultantDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/service/:serviceId" element={<ServiceDetail />} />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                }
              />
              <Route path="/consultant/:userId" element={<ConsultantProfile />} />
              <Route path="/buyer/:userId" element={<BuyerProfile />} />
              <Route path="/profile/consultant/:userId" element={<ConsultantProfile />} />
              <Route path="/profile/buyer/:userId" element={<BuyerProfile />} />
              <Route path="/profile/seller/:userId" element={<SellerProfile />} />
              <Route
                path="/lead-gen-campaigns"
                element={
                  <ProtectedRoute>
                    <LeadGenCampaigns />
                  </ProtectedRoute>
                }
              />
              <Route path="/campaign-preview/:token" element={<CampaignPreview />} />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ModeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
