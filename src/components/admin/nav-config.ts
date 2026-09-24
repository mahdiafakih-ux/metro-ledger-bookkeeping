import {
  LayoutDashboard,
  Compass,
  Target,
  CalendarDays,
  ClipboardList,
  Users,
  Building2,
  Kanban,
  PhoneCall,
  CheckSquare,
  DollarSign,
  Receipt,
  Car,
  BarChart3,
  FileText,
  Settings,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/command-center", label: "Command Center", icon: Compass },
  { href: "/admin/goal", label: "Goal Tracker", icon: Target },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/appointments", label: "Appointments", icon: ClipboardList },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/businesses", label: "Businesses", icon: Building2 },
  { href: "/admin/notaries", label: "Notaries", icon: BadgeCheck },
  { href: "/admin/pipeline", label: "Sales Pipeline", icon: Kanban },
  { href: "/admin/outreach", label: "Outreach", icon: PhoneCall },
  { href: "/admin/scorecard", label: "Daily Scorecard", icon: CheckSquare },
  { href: "/admin/revenue", label: "Revenue", icon: DollarSign },
  { href: "/admin/expenses", label: "Expenses", icon: Receipt },
  { href: "/admin/mileage", label: "Mileage", icon: Car },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/invoices", label: "Invoices", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];
