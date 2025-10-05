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
                  ConsultHub
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
          {/* Top Header */}
          <header className="h-16 flex items-center justify-between border-b bg-card/50 backdrop-blur-sm px-4 sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-8 w-8">
                {isMobile && <Menu className="h-5 w-5" />}
              </SidebarTrigger>
              {title && (
                <div>
                  <h1 className="font-semibold text-lg text-foreground">{title}</h1>
                  {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
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
              
              {/* Wallet Balance - Clickable */}
              <div 
                onClick={() => setShowTopUpModal(true)}
                className="flex items-center space-x-1 sm:space-x-2 bg-card border rounded-lg px-2 sm:px-3 py-2 cursor-pointer hover:bg-accent/10 transition-colors"
              >
                <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
                <span className="font-semibold text-foreground text-sm sm:text-base">
                  {profile?.flexi_credits_balance?.toLocaleString() || 0}
                </span>
                <span className="text-muted-foreground text-xs sm:text-sm hidden sm:inline">
                  flexi-credits
                </span>
              </div>
              
              {/* Locked Awarded FXC - Click to view in dashboard */}
              <div 
                onClick={() => navigate('/dashboard?tab=awarded')}
                className="flex items-center space-x-1 sm:space-x-2 bg-orange-500/10 border border-orange-200 dark:border-orange-800 rounded-lg px-2 sm:px-3 py-2 cursor-pointer hover:bg-orange-500/20 transition-colors"
              >
                <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600 dark:text-orange-400" />
                <span className="font-semibold text-orange-600 dark:text-orange-400 text-sm sm:text-base">
                  {awardedCreditsData?.lockedBalance?.toFixed(1) || '0.0'}
                </span>
                <span className="text-orange-600/70 dark:text-orange-400/70 text-xs sm:text-sm hidden sm:inline">
                  AFC
                </span>
              </div>
              
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

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
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