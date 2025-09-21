import { NavLink, useLocation } from "react-router-dom";
import { 
  TrendingUp, 
  Settings, 
  DollarSign, 
  Briefcase, 
  Target 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminNavigationProps {
  className?: string;
}

export function AdminNavigation({ className }: AdminNavigationProps) {
  const location = useLocation();

  const navItems = [
    {
      path: '/admin-dashboard/overview',
      label: 'Overview',
      icon: TrendingUp,
    },
    {
      path: '/admin-dashboard/users',
      label: 'User Management',
      icon: Settings,
    },
    {
      path: '/admin-dashboard/billing',
      label: 'Billing & Transactions',
      icon: DollarSign,
    },
    {
      path: '/admin-dashboard/services',
      label: 'Service Management',  
      icon: Briefcase,
    },
    {
      path: '/admin-dashboard/campaigns',
      label: 'Campaign Management',
      icon: Target,
      subPaths: [
        '/admin-dashboard/campaigns/targets',
        '/admin-dashboard/campaigns/scripts', 
        '/admin-dashboard/campaigns/monitor'
      ]
    },
  ];

  const isActiveRoute = (item: typeof navItems[0]) => {
    if (item.subPaths) {
      return location.pathname === item.path || item.subPaths.some(subPath => location.pathname === subPath);
    }
    return location.pathname === item.path;
  };

  return (
    <div className={cn("mb-8", className)}>
      <nav className="flex space-x-1 bg-muted/30 p-1 rounded-lg max-w-5xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item);
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                "hover:bg-background/80",
                isActive 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}