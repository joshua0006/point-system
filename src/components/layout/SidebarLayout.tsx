import { ReactNode, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { TopUpModal } from "@/components/TopUpModal"
import { ModeToggle } from "@/components/ModeToggle"
import { useMode } from "@/contexts/ModeContext"
import { Button } from "@/components/ui/button"
import { Link, useNavigate } from "react-router-dom"
import { useAwardedCredits } from "@/hooks/useAwardedCredits"
import { 
  User, 
  Settings, 
  LogOut, 
  Wallet,
  Menu,
  Lock
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useIsMobile } from "@/hooks/use-mobile"

interface SidebarLayoutProps {
  children: ReactNode
  title?: string
  description?: string
}

export function SidebarLayout({ children, title, description }: SidebarLayoutProps) {
  const { profile, signOut } = useAuth()
  const { isSellerMode } = useMode()
  const isMobile = useIsMobile()
  const { data: awardedCreditsData } = useAwardedCredits()
  const [showTopUpModal, setShowTopUpModal] = useState(false)
  const navigate = useNavigate()
  
  const userRole = profile?.role || "user"

  const getProfilePath = () => {
    if (!profile) return "/"
    
    if (profile.role === "consultant") {
      return `/profile/consultant/${profile.user_id}`
    } else {
      return `/profile/buyer/${profile.user_id}`
    }
  }

  // Don't render sidebar for unauthenticated users
  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg sm:text-xl text-foreground">
                  AgentHub
                </span>
              </Link>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/auth">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/auth">Sign Up</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <main className="flex-1">
          {children}
        </main>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col">
          {/* Top Header - WCAG 2.1 SC 1.3.1, 2.4.1 */}
          <header className="h-16 flex items-center justify-between border-b bg-card/50 backdrop-blur-sm px-2 sm:px-4 sticky top-0 z-40" role="banner">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-8 w-8">
                {isMobile && <Menu className="h-5 w-5" />}
              </SidebarTrigger>
              {title && (
                <div className="min-w-0">
                  <h1 className="font-semibold text-lg text-foreground truncate max-w-[120px] sm:max-w-none">{title}</h1>
                  {description && !isMobile && (
                    <p className="text-sm text-muted-foreground truncate">{description}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Demo mode indicator */}
              {profile?.email?.includes('demo') && !isMobile && (
                <div className="bg-accent/10 text-accent-foreground px-2 py-1 rounded text-xs font-medium">
                  Demo Mode
                </div>
              )}

              {/* Mode toggle for non-consultant users on desktop */}
              {userRole !== "consultant" && !isMobile && (
                <ModeToggle />
              )}

              {/* Wallet Balance - Clickable - WCAG 2.1 SC 2.1.1, 2.5.5 */}
              <button
                onClick={() => setShowTopUpModal(true)}
                className="group flex items-center gap-1 bg-primary/10 border border-primary/20 rounded-lg px-1.5 sm:px-3 py-2 cursor-pointer hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[44px]"
                aria-label={`Wallet balance: ${profile?.flexi_credits_balance?.toLocaleString() || 0} flexi-credits. Click to top up`}
                type="button"
              >
                <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-primary group-hover:text-white transition-colors" aria-hidden="true" />
                <span className="font-semibold text-primary text-sm sm:text-base group-hover:text-white transition-colors">
                  {profile?.flexi_credits_balance?.toLocaleString() || 0}
                </span>
                <span className="text-primary/70 text-xs sm:text-sm hidden sm:inline group-hover:text-white transition-colors" aria-hidden="true">
                  flexi-credits
                </span>
              </button>
              
              {/* Locked Awarded FXC - Click to view in dashboard - WCAG 2.1 SC 2.1.1, 2.5.5 */}
              <button
                onClick={() => navigate('/dashboard?tab=awarded')}
                className="group flex items-center gap-1 bg-success/10 border border-success/20 rounded-lg px-1.5 sm:px-3 py-2 cursor-pointer hover:bg-success/90 transition-colors focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2 min-h-[44px]"
                aria-label={`Locked awarded credits: ${awardedCreditsData?.lockedBalance?.toFixed(1) || '0.0'} AFC. Click to view details in dashboard`}
                type="button"
              >
                <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-success group-hover:text-white transition-colors" aria-hidden="true" />
                <span className="font-semibold text-success text-sm sm:text-base group-hover:text-white transition-colors">
                  {awardedCreditsData?.lockedBalance?.toFixed(1) || '0.0'}
                </span>
                <span className="text-success/70 text-xs sm:text-sm hidden sm:inline group-hover:text-white transition-colors" aria-hidden="true">
                  AFC
                </span>
              </button>
              
              {/* User Menu - Hidden on mobile */}
              {!isMobile && (
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
            </div>
          </header>

          {/* Main Content - WCAG 2.1 SC 1.3.1, 2.4.1 */}
          <main className="flex-1 overflow-auto" role="main">
            {children}
          </main>
        </div>
      </div>
      
      {/* Top Up Modal */}
      <TopUpModal 
        isOpen={showTopUpModal} 
        onClose={() => setShowTopUpModal(false)}
        onSuccess={() => {
          setShowTopUpModal(false)
        }}
      />
    </SidebarProvider>
  )
}