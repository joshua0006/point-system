
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, User, LayoutDashboard, MessageCircle } from "lucide-react";
import { MobileNavigation } from "./MobileNavigation";

export function Navigation() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getDashboardRoute = () => {
    if (!profile) return "/dashboard";
    
    switch (profile.role) {
      case "consultant":
        return "/consultant-dashboard";
      case "admin":
        return "/admin-dashboard";
      default:
        return "/dashboard";
    }
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">PP</span>
            </div>
            <span className="font-bold text-xl hidden sm:block">Point Perk Plaza</span>
            <span className="font-bold text-xl sm:hidden">PPP</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/marketplace" 
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Marketplace
            </Link>
            
            {user && (
              <>
                <Link 
                  to={getDashboardRoute()} 
                  className="text-foreground hover:text-primary transition-colors font-medium"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/messages" 
                  className="text-foreground hover:text-primary transition-colors font-medium"
                >
                  Messages
                </Link>
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            <ModeToggle />
            
            {user ? (
              <div className="flex items-center space-x-2">
                {/* Mobile Navigation - Shows for authenticated users */}
                <MobileNavigation />
                
                {/* Desktop User Menu */}
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10">
                            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-background border shadow-lg" align="end" forceMount>
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          <p className="font-medium">{profile?.full_name || "User"}</p>
                          <p className="w-[200px] truncate text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <DropdownMenuItem asChild>
                        <Link to={getDashboardRoute()} className="cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/messages" className="cursor-pointer">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Messages
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {/* Mobile Navigation - Shows for non-authenticated users */}
                <MobileNavigation />
                
                {/* Desktop Auth Button */}
                <div className="hidden md:block">
                  <Link to="/auth">
                    <Button>Sign In</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
