"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Brain, Calendar, BarChart3, Menu } from "lucide-react";
import clsx from "clsx";

const links = [
  { href: "/dashboard", icon: LayoutDashboard },
  { href: "/quizzes", icon: Brain },
  { href: "/planner", icon: Calendar },
  { href: "/analytics", icon: BarChart3 },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t z-50 px-2 py-2 safe-area-pb">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {links.map(({ href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "p-3 rounded-xl transition-all",
              pathname === href ? "text-brand-500 bg-brand-500/15" : "text-[var(--text-secondary)]"
            )}
          >
            <Icon className="w-6 h-6" />
          </Link>
        ))}
        <button className="p-3 text-[var(--text-secondary)]">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
}
