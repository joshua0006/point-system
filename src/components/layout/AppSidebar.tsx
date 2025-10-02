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
  Wallet,
  Target,
  Phone,
  Headphones,
  Sparkles,
  PenTool,
  ChevronDown,
  ChevronRight
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

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

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    campaigns: true,
    aiTools: false,
    gifting: false,
  })

  const isCollapsed = state === "collapsed"

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path)

  const toggleGroup = (groupKey: string) => {
    setOpenGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))
  }

  // Check if any item in a group is active
  const isGroupActive = (items: NavItem[]) => {
    return items.some(item => isActive(item.url))
  }

  // Navigation groups based on user role
  const getNavGroups = (): NavGroup[] => {
    const campaignGroup: NavGroup = {
      title: "Campaigns",
      icon: Megaphone,
      roles: ["user", "admin"],
      items: [
        { title: "My Campaigns", url: "/campaigns/my-campaigns", icon: BarChart3, roles: ["user", "admin"] },
        { title: "Launch Campaign", url: "/campaigns/launch", icon: Target, roles: ["user", "admin"] },
        { title: "Facebook Ads", url: "/campaigns/facebook-ads", icon: Target, roles: ["user", "admin"] },
        { title: "Cold Calling", url: "/campaigns/cold-calling", icon: Phone, roles: ["user", "admin"] },
        { title: "VA Support", url: "/campaigns/va-support", icon: Headphones, roles: ["user", "admin"] },
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
        { title: "Services", url: "/services", icon: Search, roles: ["consultant"] },
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
              {singleNavItems.map((item) => (
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

        {/* Grouped Navigation Items */}
        {navGroups.map((group) => {
          const groupKey = group.title.toLowerCase().replace(/\s+/g, '')
          const isOpen = openGroups[groupKey]
          const hasActiveItem = isGroupActive(group.items)
          
          return (
            <SidebarGroup key={group.title}>
              <Collapsible open={isOpen || isCollapsed} onOpenChange={() => !isCollapsed && toggleGroup(groupKey)}>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className={`h-10 w-full justify-start ${hasActiveItem ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'} ${isCollapsed ? 'justify-center' : ''}`}>
                    <group.icon className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left">{group.title}</span>
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 flex-shrink-0" />
                        )}
                      </>
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                
                {!isCollapsed && (
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu className="ml-4">
                        {group.items.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild className="h-9">
                              <NavLink 
                                to={item.url} 
                                className={({ isActive: navIsActive }) => 
                                  `flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm ${getNavClass(item.url)}`
                                }
                              >
                                <item.icon className="h-3 w-3 flex-shrink-0" />
                                <span className="flex-1">{item.title}</span>
                                {item.badge && (
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
                  </CollapsibleContent>
                )}
              </Collapsible>
            </SidebarGroup>
          )
        })}
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