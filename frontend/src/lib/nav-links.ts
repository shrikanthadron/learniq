import {
  LayoutDashboard,
  Brain,
  Calendar,
  BarChart3,
  BookOpen,
  FileText,
  Trophy,
  Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const studentLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quizzes", label: "Quizzes", icon: Brain },
  { href: "/planner", label: "Planner", icon: Calendar },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/subjects", label: "Subjects", icon: BookOpen },
  { href: "/achievements", label: "Achievements", icon: Trophy },
];

export const adminLink: NavLink = { href: "/admin", label: "Admin", icon: Shield };

export function getNavLinks(role?: string): NavLink[] {
  if (role === "ADMIN" || role === "TEACHER") {
    return [...studentLinks, adminLink];
  }
  return studentLinks;
}

export const mobileQuickLinks = studentLinks.slice(0, 4);
