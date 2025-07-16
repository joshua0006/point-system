
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMode } from "@/contexts/ModeContext";
import { ModeToggle } from "@/components/ModeToggle";
import { BalanceDetailsModal } from "@/components/dashboard/BalanceDetailsModal";
import { TopUpModal } from "@/components/TopUpModal";
import { useUnreadMessageCount } from "@/hooks/useMessages";
import { useState } from "react";
import { 
  User, 
  Users, 
  Wallet, 
  Search,
  MessageCircle,
  BarChart3,
  Menu,
  Settings,
  LogOut
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navigation() {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { isSellerMode, toggleMode, canAccessSellerMode } = useMode();
  const { data: unreadCount = 0 } = useUnreadMessageCount();
  const userRole = profile?.role || "user";
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Define navigation items type
  type NavItem = {
    path: string;
    label: string;
    icon: any;
    roles: string[];
    hasNotification?: boolean;
  };

  // Define navigation items - for consultants, show all three main tabs
  const getNavItems = (): NavItem[] => {
    if (userRole === "consultant") {
      return [
        { path: "/marketplace", label: "Marketplace", icon: Search, roles: ["consultant"] },
        { path: "/messages", label: "Messages", icon: MessageCircle, roles: ["consultant"], hasNotification: unreadCount > 0 },
        { path: "/consultant-dashboard", label: "Dashboard", icon: BarChart3, roles: ["consultant"] },
      ];
    }

    // For other users, use the existing mode-based logic
    const buyerNavItems = [
      { path: "/marketplace", label: "Marketplace", icon: Search, roles: ["user", "admin"] },
      { path: "/messages", label: "Messages", icon: MessageCircle, roles: ["user", "admin"], hasNotification: unreadCount > 0 },
      { path: "/dashboard", label: "Dashboard", icon: User, roles: ["user", "admin"] },
      { path: "/admin", label: "Admin", icon: Users, roles: ["admin"] },
    ];

    const sellerNavItems = [
      { path: "/consultant-dashboard", label: "Dashboard", icon: BarChart3, roles: ["admin"] },
      { path: "/messages", label: "Messages", icon: MessageCircle, roles: ["admin"], hasNotification: unreadCount > 0 },
      { path: "/admin", label: "Admin", icon: Users, roles: ["admin"] },
    ];

    return isSellerMode ? sellerNavItems : buyerNavItems;
  };

  const navItems = getNavItems();
  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  // Mock transaction data for the balance modal
  const mockTransactions = [
    {
      id: "1",
      type: "spent" as const,
      service: "Strategic Business Consultation",
      consultant: "John Smith",
      points: 500,
      date: "2024-01-18",
      status: "completed"
    },
    {
      id: "2",
      type: "earned" as const,
      service: "Growth Strategy Workshop",
      points: 350,
      date: "2024-01-19",
      status: "completed"
    },
    {
      id: "3",
      type: "spent" as const,
      service: "Marketing Review",
      consultant: "Sarah Johnson",
      points: 250,
      date: "2024-01-20",
      status: "completed"
    },
  ];

  const getProfilePath = () => {
    if (!profile) return "/";
    
    if (profile.role === "consultant") {
      return `/profile/consultant/${profile.user_id}`;
    } else {
      return `/profile/buyer/${profile.user_id}`;
    }
  };

  return (
    <>
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
                        className="flex items-center space-x-2 relative"
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                        {item.hasNotification && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {profile?.email?.includes('demo') && (
                <div className="bg-accent/10 text-accent-foreground px-2 py-1 rounded text-xs font-medium">
                  Demo Mode
                </div>
              )}
              
              {/* Only show mode toggle for non-consultant users */}
              {profile && userRole !== "consultant" && (
                <ModeToggle />
              )}
              
              {profile ? (
                <>
                  <div 
                    className="flex items-center space-x-2 bg-card border rounded-lg px-3 py-2 cursor-pointer hover:bg-accent/5 transition-colors"
                    onClick={() => setBalanceModalOpen(true)}
                  >
                    <Wallet className="w-4 h-4 text-accent" />
                    <span className="font-semibold text-foreground">{profile?.points_balance?.toLocaleString() || 0}</span>
                    <span className="text-muted-foreground text-sm">points</span>
                  </div>
                  
                  {unreadCount > 0 && (
                    <div className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 font-medium">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Menu className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link to={getProfilePath()} className="flex items-center space-x-2 cursor-pointer">
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="w-4 h-4 mr-2" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={signOut} className="text-red-600 focus:text-red-600">
                        <LogOut className="w-4 h-4 mr-2" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/auth">Login</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/auth">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Balance Details Modal */}
      <BalanceDetailsModal
        open={balanceModalOpen}
        onOpenChange={setBalanceModalOpen}
        transactions={mockTransactions}
        onTopUp={() => {
          setBalanceModalOpen(false);
          setTopUpModalOpen(true);
        }}
      />

      {/* Top Up Modal */}
      <TopUpModal 
        isOpen={topUpModalOpen}
        onClose={() => setTopUpModalOpen(false)}
      />
    </>
  );
}
