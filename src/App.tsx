
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ModeProvider } from "@/contexts/ModeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Marketplace from "./pages/Marketplace";
import ServiceDetail from "./pages/ServiceDetail";
import Messages from "./pages/Messages";
import Index from "./pages/Index";
import UserDashboard from "./pages/UserDashboard";
import ConsultantDashboard from "./pages/ConsultantDashboard";
import SellerDashboard from "./pages/SellerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import BuyerProfile from "./pages/BuyerProfile";
import ConsultantProfile from "./pages/ConsultantProfile";
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
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Index />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/service/:serviceId" element={<ServiceDetail />} />
            <Route path="/profile/buyer/:userId" element={<BuyerProfile />} />
            <Route path="/profile/consultant/:userId" element={<ConsultantProfile />} />
            <Route path="/messages" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            } />
            <Route path="/seller" element={
              <ProtectedRoute>
                <SellerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/services" element={
              <ProtectedRoute>
                <ConsultantDashboard />
              </ProtectedRoute>
            } />
            <Route path="/bookings" element={
              <ProtectedRoute>
                <ConsultantDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ModeProvider>
  </AuthProvider>
</QueryClientProvider>
);

export default App;
