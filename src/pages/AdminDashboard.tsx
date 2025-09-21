import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect to overview if user is on base admin-dashboard path
    if (location.pathname === '/admin-dashboard') {
      navigate('/admin-dashboard/overview', { replace: true });
    }
  }, [location.pathname, navigate]);

  return null; // This component just handles redirects
}