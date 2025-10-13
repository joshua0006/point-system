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
  Store,
  Megaphone,
  Gift,
  Settings,
  Bot,
  Briefcase,
  Link as LinkIcon,
  Archive,
  Wallet,
  Target,
  Phone,
  Sparkles,
  PenTool,
  MessageSquare,
  Rocket
} from "lucide-react"
import { iconA11y } from "@/lib/iconConstants"

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

interface NavGroup {
  title: string
  icon: any
  items: NavItem[]
  roles: string[]
}

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const { profile } = useAuth()
  const { isSellerMode } = useMode()
  const currentPath = location.pathname
  const userRole = profile?.role === "master_admin" ? "admin" : (profile?.role || "user")

  const isCollapsed = state === "collapsed"

  // Navigation groups based on user role
  const getNavGroups = (): NavGroup[] => {
    const campaignGroup: NavGroup = {
      title: "Campaigns",
      icon: Megaphone,
      roles: ["user", "admin"],
      items: [
        { title: "My Campaigns", url: "/campaigns/my-campaigns", icon: BarChart3, roles: ["user", "admin"] },
        { title: "Launch Campaign", url: "/campaigns/launch", icon: Rocket, roles: ["user", "admin"] },
        { title: "Facebook Ads", url: "/campaigns/facebook-ads", icon: Target, roles: ["user", "admin"] },
        { title: "Cold Calling", url: "/campaigns/cold-calling", icon: Phone, roles: ["user", "admin"] },
        { title: "VA Support", url: "/campaigns/va-support", icon: MessageSquare, roles: ["user", "admin"] },
      ]
    }


    const giftingGroup: NavGroup = {
      title: "Gifting",
      icon: Gift,
      roles: ["user", "admin"],
      items: [
        { title: "Gift Merchants", url: "/gifting", icon: Gift, roles: ["user", "admin"] },
      ]
    }

    if (userRole === "consultant") {
      return []
    }

    return [campaignGroup, giftingGroup]
  }

  // Single navigation items (not in groups)
  const getSingleNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      { title: "Home", url: "/", icon: Home, roles: ["user", "consultant", "admin"] },
    ]

    if (userRole === "consultant") {
      return [
        ...baseItems,
        { title: "Services", url: "/services", icon: Store, roles: ["consultant"] },
        { title: "Dashboard", url: "/consultant-dashboard", icon: BarChart3, roles: ["consultant"] },
        { title: "Settings", url: "/settings", icon: Settings, roles: ["consultant"] },
      ]
    }

    // For regular users and admins
    const userItems: NavItem[] = [
      { title: "Dashboard", url: "/dashboard", icon: BarChart3, roles: ["user", "admin"] },
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
      ...userItems,
      ...(userRole === "admin" ? adminItems : []),
      ...settingsItems,
    ]
  }

  const navGroups = getNavGroups().filter(group => group.roles.includes(userRole))
  const singleNavItems = getSingleNavItems().filter(item => item.roles.includes(userRole))

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <Wallet className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="font-bold text-lg text-foreground">AgentHub</h2>
              <p className="text-xs text-muted-foreground">v2.0</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {/* Single Navigation Items */}
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {singleNavItems.map((item) => {
                const isItemActive = currentPath === item.url || (item.url !== "/" && currentPath.startsWith(item.url))
                return (
                  <SidebarMenuItem key={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      aria-label={item.title}
                      aria-current={isItemActive ? "page" : undefined}
                    >
                      {({ isActive }) => (
                        <SidebarMenuButton
                          isActive={isActive}
                          className="h-10 w-full data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:hover:bg-primary/90"
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                          {!isCollapsed && (
                            <span className="flex-1">{item.title}</span>
                          )}
                          {item.badge && !isCollapsed && (
                            <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </SidebarMenuButton>
                      )}
                    </NavLink>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Grouped Navigation Items */}
        {navGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isItemActive = currentPath === item.url || currentPath.startsWith(item.url)
                  return (
                    <SidebarMenuItem key={item.title}>
                      <NavLink
                        to={item.url}
                        aria-label={item.title}
                        aria-current={isItemActive ? "page" : undefined}
                      >
                        {({ isActive }) => (
                          <SidebarMenuButton
                            isActive={isActive}
                            className="h-10 w-full data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:hover:bg-primary/90"
                          >
                            <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                            {!isCollapsed && (
                              <span className="flex-1">{item.title}</span>
                            )}
                            {item.badge && !isCollapsed && (
                              <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </SidebarMenuButton>
                        )}
                      </NavLink>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
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