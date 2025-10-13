import {
  User,
  Users,
  Store,
  BarChart3,
  Megaphone,
  Gift
} from "lucide-react";
import { NavItem, UserRole } from './types';

export const navigationConfig: Partial<Record<UserRole, NavItem[]>> = {
  user: [
    {
      path: "/services",
      label: "Marketplace",
      icon: Store,
      roles: ["user", "admin"],
      children: [
        { path: "/services", label: "Services", icon: Store, roles: ["user", "admin"] },
        { path: "/campaigns", label: "Campaigns", icon: Megaphone, roles: ["user", "admin"] },
        { path: "/gifting", label: "Gifting", icon: Gift, roles: ["user", "admin"] }
      ]
    },
    { path: "/dashboard", label: "Dashboard", icon: User, roles: ["user", "admin"] }
  ],

  consultant: [
    { path: "/services", label: "Services", icon: Store, roles: ["consultant"] },
    { path: "/consultant-dashboard", label: "Dashboard", icon: BarChart3, roles: ["consultant"] }
  ],

  admin: [
    {
      path: "/services",
      label: "Marketplace",
      icon: Store,
      roles: ["admin"],
      children: [
        { path: "/services", label: "Services", icon: Store, roles: ["admin"] },
        { path: "/campaigns", label: "Campaigns", icon: Megaphone, roles: ["admin"] },
        { path: "/gifting", label: "Gifting", icon: Gift, roles: ["admin"] }
      ]
    },
    { path: "/dashboard", label: "Dashboard", icon: User, roles: ["admin"] },
    { path: "/admin-dashboard", label: "Admin", icon: Users, roles: ["admin"] }
  ],

  master_admin: [
    {
      path: "/services",
      label: "Marketplace",
      icon: Store,
      roles: ["master_admin"],
      children: [
        { path: "/services", label: "Services", icon: Store, roles: ["master_admin"] },
        { path: "/campaigns", label: "Campaigns", icon: Megaphone, roles: ["master_admin"] },
        { path: "/gifting", label: "Gifting", icon: Gift, roles: ["master_admin"] }
      ]
    },
    { path: "/dashboard", label: "Dashboard", icon: User, roles: ["master_admin"] },
    { path: "/admin-dashboard", label: "Admin", icon: Users, roles: ["master_admin"] }
  ]
};

export const sellerNavigationConfig: NavItem[] = [
  { path: "/consultant-dashboard", label: "Dashboard", icon: BarChart3, roles: ["admin", "master_admin"] },
  { path: "/admin-dashboard", label: "Admin", icon: Users, roles: ["admin", "master_admin"] }
];