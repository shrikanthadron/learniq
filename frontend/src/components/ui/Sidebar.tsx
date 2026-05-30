"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Brain, Calendar, BarChart3, BookOpen,
  Settings, Shield, LogOut, Moon, Sun, Zap, FileText, Trophy,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import clsx from "clsx";

const studentLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quizzes", label: "Quizzes", icon: Brain },
  { href: "/planner", label: "Planner", icon: Calendar },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/subjects", label: "Subjects", icon: BookOpen },
  { href: "/achievements", label: "Achievements", icon: Trophy },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  const links = user?.role === "ADMIN" || user?.role === "TEACHER"
    ? [...studentLinks, { href: "/admin", label: "Admin", icon: Shield }]
    : studentLinks;

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen glass border-r border-[var(--glass-border)] p-4">
      <Link href="/dashboard" className="flex items-center gap-2 px-2 py-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <span className="font-display font-bold text-xl gradient-text">LearnIQ</span>
      </Link>

      <nav className="flex-1 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx("sidebar-link", pathname === href && "active")}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="space-y-2 pt-4 border-t border-[var(--glass-border)]">
        <button onClick={toggle} className="sidebar-link w-full">
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <Link href="/settings" className="sidebar-link">
          <Settings className="w-5 h-5" />
          Settings
        </Link>
        <button onClick={logout} className="sidebar-link w-full text-red-500 hover:text-red-600">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

      {user && (
        <div className="mt-4 glass-card !p-4">
          <p className="font-semibold text-sm truncate">{user.name}</p>
          <p className="text-xs text-[var(--text-secondary)]">Level {user.level} · {user.xp} XP</p>
          <div className="progress-bar mt-2">
            <div className="progress-fill" style={{ width: `${(user.xp % 500) / 5}%` }} />
          </div>
        </div>
      )}
    </aside>
  );
}
