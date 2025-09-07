
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMode } from "@/contexts/ModeContext";
import { ModeToggle } from "@/components/ModeToggle";
import { BalanceDetailsModal } from "@/components/dashboard/BalanceDetailsModal";
import { TopUpModal } from "@/components/TopUpModal";

import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { 
  User, 
  Users, 
  Wallet, 
  Search,
  BarChart3,
  Menu,
  Settings,
  LogOut,
  Bot,
  X,
  ChevronDown,
  Gift,
  Megaphone
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BreadcrumbsBar } from "@/components/BreadcrumbsBar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navigation() {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { isSellerMode, toggleMode, canAccessSellerMode } = useMode();
  
  const userRole = profile?.role || "user";
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

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
        { path: "/services", label: "Services", icon: Search, roles: ["consultant"] },
        
        { path: "/consultant-dashboard", label: "Dashboard", icon: BarChart3, roles: ["consultant"] },
      ];
    }

    // For other users, use the existing mode-based logic
    const buyerNavItems = [
      { path: "/services", label: "Services", icon: Search, roles: ["user", "admin"] },
      
      { path: "/dashboard", label: "Dashboard", icon: User, roles: ["user", "admin"] },
      { path: "/admin-dashboard", label: "Admin", icon: Users, roles: ["admin"] },
    ];

    const sellerNavItems = [
      { path: "/consultant-dashboard", label: "Dashboard", icon: BarChart3, roles: ["admin"] },
      
      { path: "/admin-dashboard", label: "Admin", icon: Users, roles: ["admin"] },
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
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 sm:space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg sm:text-xl text-foreground">
                  {isMobile ? "Hub" : "ConsultHub"}
                </span>
              </Link>
              
              <div className="hidden md:flex items-center space-x-1">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  
                  // Special handling for Services to show marketplace dropdown
                  if (item.path === "/services") {
                    return (
                      <DropdownMenu key="marketplace">
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant={["/services", "/campaigns", "/gifting"].includes(location.pathname) ? "default" : "ghost"}
                            size="sm"
                            className="flex items-center space-x-2"
                          >
                            <Search className="w-4 h-4" />
                            <span>Marketplace</span>
                            <ChevronDown className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link to="/services" className="flex items-center space-x-2 cursor-pointer">
                              <Search className="w-4 h-4" />
                              <span>Services</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/campaigns" className="flex items-center space-x-2 cursor-pointer">
                              <Megaphone className="w-4 h-4" />
                              <span>Campaigns</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/gifting" className="flex items-center space-x-2 cursor-pointer">
                              <Gift className="w-4 h-4" />
                              <span>Gifting</span>
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  }
                  
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

            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
              {profile?.email?.includes('demo') && !isMobile && (
                <div className="bg-accent/10 text-accent-foreground px-2 py-1 rounded text-xs font-medium">
                  Demo Mode
                </div>
              )}
              
              {/* Only show mode toggle for non-consultant users on desktop */}
              {profile && userRole !== "consultant" && !isMobile && (
                <ModeToggle />
              )}
              
              {profile ? (
                <>
                  <div 
                    className="flex items-center space-x-1 sm:space-x-2 bg-card border rounded-lg px-2 sm:px-3 py-2 cursor-pointer hover:bg-accent/5 transition-colors"
                    onClick={() => setBalanceModalOpen(true)}
                  >
                    <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
                    <span className="font-semibold text-foreground text-sm sm:text-base">{profile?.flexi_credits_balance?.toLocaleString() || 0}</span>
                    <span className="text-muted-foreground text-xs sm:text-sm hidden sm:inline">flexi-credits</span>
                  </div>
                  
                  
                  {isMobile ? (
                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="relative">
                          <Menu className="w-4 h-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-80">
                        <SheetHeader>
                          <SheetTitle className="text-left">Menu</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6 space-y-1">
                          {/* Demo mode indicator */}
                          {profile?.email?.includes('demo') && (
                            <div className="bg-accent/10 text-accent-foreground px-3 py-2 rounded text-xs font-medium mb-4">
                              Demo Mode
                            </div>
                          )}
                          
                          {/* Mode Toggle for non-consultants */}
                          {userRole !== "consultant" && (
                            <div className="px-3 py-2 border-b">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">View Mode</span>
                                <ModeToggle />
                              </div>
                            </div>
                          )}
                          
                          {/* Navigation Items */}
                          {filteredNavItems.map((item) => {
                            const Icon = item.icon;
                            
                            // Special handling for Services to show marketplace submenu
                            if (item.path === "/services") {
                              return (
                                <div key="marketplace-mobile" className="space-y-1">
                                  <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
                                    Marketplace
                                  </div>
                                  <Link
                                    to="/services"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center px-6 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent"
                                  >
                                    <Search className="w-4 h-4 mr-3" />
                                    Services
                                  </Link>
                                  <Link
                                    to="/campaigns"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center px-6 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent"
                                  >
                                    <Megaphone className="w-4 h-4 mr-3" />
                                    Campaigns
                                  </Link>
                                  <Link
                                    to="/gifting"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center px-6 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent"
                                  >
                                    <Gift className="w-4 h-4 mr-3" />
                                    Gifting
                                  </Link>
                                </div>
                              );
                            }
                            
                            return (
                              <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors hover:bg-accent relative"
                              >
                                <Icon className="w-5 h-5 mr-3" />
                                {item.label}
                                {item.hasNotification && (
                                  <div className="absolute right-3 w-2 h-2 bg-red-500 rounded-full"></div>
                                )}
                              </Link>
                            );
                          })}
                          
                          <div className="border-t pt-4 mt-4 space-y-1">
                            <Link
                              to={getProfilePath()}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors hover:bg-accent"
                            >
                              <User className="w-5 h-5 mr-3" />
                              Profile
                            </Link>
                            <Link
                              to="/settings"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors hover:bg-accent"
                            >
                              <Settings className="w-5 h-5 mr-3" />
                              Settings
                            </Link>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                signOut();
                                setMobileMenuOpen(false);
                              }}
                              className="w-full justify-start px-3 py-3 text-sm font-medium text-red-600 hover:text-red-600 hover:bg-red-50"
                            >
                              <LogOut className="w-5 h-5 mr-3" />
                              Logout
                            </Button>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  ) : (
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
                        <DropdownMenuItem asChild>
                          <Link to="/settings" className="flex items-center space-x-2 cursor-pointer">
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={signOut} className="text-red-600 focus:text-red-600">
                          <LogOut className="w-4 h-4 mr-2" />
                          <span>Logout</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size={isMobile ? "sm" : "sm"} asChild>
                    <Link to="/auth">{isMobile ? "Login" : "Login"}</Link>
                  </Button>
                  <Button size={isMobile ? "sm" : "sm"} asChild>
                    <Link to="/auth">{isMobile ? "Sign Up" : "Sign Up"}</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <BreadcrumbsBar />

      {/* Balance Details Modal */}
      <BalanceDetailsModal
        open={balanceModalOpen}
        onOpenChange={setBalanceModalOpen}
        onTopUp={() => {
          setBalanceModalOpen(false);
          setTopUpModalOpen(true);
        }}
        userStats={{
          totalPoints: profile?.flexi_credits_balance || 0,
          pointsSpent: 0,
          pointsEarned: 0,
          servicesBooked: 0,
          completedSessions: 0
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
