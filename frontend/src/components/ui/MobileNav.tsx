"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Settings, LogOut, Moon, Sun, Zap, X } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getNavLinks, mobileQuickLinks } from "@/lib/nav-links";

export function MobileNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = getNavLinks(user?.role);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t border-[var(--glass-border)] z-50 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {mobileQuickLinks.map(({ href, icon: Icon }) => (
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
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className={clsx(
              "p-3 rounded-xl transition-all",
              menuOpen ? "text-brand-500 bg-brand-500/15" : "text-[var(--text-secondary)]"
            )}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <div className="lg:hidden fixed inset-0 z-[60]">
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto glass border-t border-[var(--glass-border)] rounded-t-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
            >
            <div className="flex items-center justify-between mb-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2"
                onClick={() => setMenuOpen(false)}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-bold text-lg gradient-text">LearnIQ</span>
              </Link>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {user && (
              <div className="glass-card !p-3 mb-4">
                <p className="font-semibold text-sm truncate">{user.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Level {user.level} · {user.xp} XP
                </p>
              </div>
            )}

            <nav className="space-y-1">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={clsx("sidebar-link", pathname === href && "active")}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="mt-4 pt-4 border-t border-[var(--glass-border)] space-y-1">
              <button
                type="button"
                onClick={toggle}
                className="sidebar-link w-full"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </button>
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="sidebar-link"
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="sidebar-link w-full text-red-500 hover:text-red-600"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </motion.div>
        </div>
        )}
      </AnimatePresence>
    </>
  );
}
