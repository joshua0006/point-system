import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { 
  User, 
  Users, 
  Wallet, 
  Search,
  List,
  Calendar
} from "lucide-react";

export function Navigation() {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const userRole = profile?.role || "user";

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/", label: "Marketplace", icon: Search, roles: ["user", "consultant", "admin"] },
    { path: "/dashboard", label: "Dashboard", icon: User, roles: ["user", "consultant", "admin"] },
    { path: "/services", label: "My Services", icon: List, roles: ["consultant", "admin"] },
    { path: "/bookings", label: "Bookings", icon: Calendar, roles: ["consultant", "admin"] },
    { path: "/admin", label: "Admin", icon: Users, roles: ["admin"] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl text-foreground">ConsultHub</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive(item.path) ? "default" : "ghost"}
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-card border rounded-lg px-3 py-2">
              <Wallet className="w-4 h-4 text-accent" />
              <span className="font-semibold text-foreground">{profile?.points_balance?.toLocaleString() || 0}</span>
              <span className="text-muted-foreground text-sm">points</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden md:block">
                {profile?.full_name || profile?.email}
              </span>
              <Button variant="outline" size="sm" onClick={signOut}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}