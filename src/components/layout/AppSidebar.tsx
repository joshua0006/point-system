import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useMode } from "@/contexts/ModeContext"
import { 
  Home,
  Calendar,
  TrendingUp,
  Users,
  UserCheck,
  BarChart3,
  Search,
  Megaphone,
  Gift,
  Settings,
  Bot,
  Briefcase,
  Link as LinkIcon,
  Archive,
  Wallet
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

interface NavItem {
  title: string
  url: string
  icon: any
  badge?: string
  roles: string[]
}

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const { profile } = useAuth()
  const { isSellerMode } = useMode()
  const currentPath = location.pathname
  const userRole = profile?.role || "user"

  const isCollapsed = state === "collapsed"

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path)

  // Navigation items based on user role and mode
  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      { title: "Home", url: "/", icon: Home, roles: ["user", "consultant", "admin"] },
    ]

    if (userRole === "consultant") {
      return [
        ...baseItems,
        { title: "Services", url: "/services", icon: Search, roles: ["consultant"] },
        { title: "AI Assistant", url: "/ai-assistant", icon: Bot, roles: ["consultant"] },
        { title: "Dashboard", url: "/consultant-dashboard", icon: BarChart3, roles: ["consultant"] },
        { title: "Messages", url: "/messages", icon: Archive, roles: ["consultant"] },
        { title: "Settings", url: "/settings", icon: Settings, roles: ["consultant"] },
      ]
    }

    // For regular users and admins
    const marketplaceItems: NavItem[] = [
      { title: "Marketplace", url: "/services", icon: Search, roles: ["user", "admin"] },
      { title: "Campaigns", url: "/campaigns", icon: Megaphone, roles: ["user", "admin"] },
      { title: "Gifting", url: "/gifting", icon: Gift, roles: ["user", "admin"] },
    ]

    const userItems: NavItem[] = [
      { title: "Dashboard", url: "/dashboard", icon: BarChart3, roles: ["user", "admin"] },
      { title: "Messages", url: "/messages", icon: Archive, roles: ["user", "admin"] },
    ]

    const adminItems: NavItem[] = [
      { title: "Admin Panel", url: "/admin-dashboard", icon: Users, roles: ["admin"] },
    ]

    const settingsItems: NavItem[] = [
      { title: "Settings", url: "/settings", icon: Settings, roles: ["user", "admin"] },
    ]

    if (isSellerMode && userRole === "admin") {
      return [
        ...baseItems,
        { title: "Consultant Dashboard", url: "/consultant-dashboard", icon: BarChart3, roles: ["admin"] },
        ...adminItems,
        ...settingsItems,
      ]
    }

    return [
      ...baseItems,
      ...marketplaceItems,
      ...userItems,
      ...(userRole === "admin" ? adminItems : []),
      ...settingsItems,
    ]
  }

  const navItems = getNavItems().filter(item => item.roles.includes(userRole))

  const getNavClass = (path: string) => {
    return isActive(path) 
      ? "bg-primary text-primary-foreground font-medium hover:bg-primary hover:text-primary-foreground" 
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  }

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wallet className="w-4 h-4 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="font-bold text-lg text-foreground">ConsultHub</h2>
              <p className="text-xs text-muted-foreground">v2.0</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink 
                      to={item.url} 
                      className={({ isActive: navIsActive }) => 
                        `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${getNavClass(item.url)}`
                      }
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="flex-1">{item.title}</span>
                      )}
                      {item.badge && !isCollapsed && (
                        <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        {!isCollapsed && profile && (
          <div className="px-2 py-2">
            <div className="text-xs text-muted-foreground mb-1">
              Signed in as
            </div>
            <div className="text-sm font-medium text-foreground truncate">
              {profile.full_name || profile.email}
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {profile.role}
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}