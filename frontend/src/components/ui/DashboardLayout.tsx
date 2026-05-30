"use client";

import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { StudyReminderScheduler } from "@/components/StudyReminderScheduler";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen mesh-bg">
      <StudyReminderScheduler />
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8 overflow-auto">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
