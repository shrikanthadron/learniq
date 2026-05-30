"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Users, Brain, BookOpen, Activity } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/ui/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

interface AdminStats {
  users: number;
  students: number;
  quizzes: number;
  attempts: number;
  subjects: number;
  avgEngagement: number;
  usersByRole: { role: string; _count: number }[];
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && user.role !== "TEACHER" && user.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    api<AdminStats>("/admin/stats")
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load admin stats"));
  }, []);

  if (user?.role !== "TEACHER" && user?.role !== "ADMIN") return null;

  const cards = stats
    ? [
        { label: "Total Users", value: stats.users, icon: Users, color: "text-brand-500" },
        { label: "Students", value: stats.students, icon: Users, color: "text-cyan-500" },
        { label: "Quizzes", value: stats.quizzes, icon: Brain, color: "text-purple-500" },
        { label: "Quiz Attempts", value: stats.attempts, icon: Activity, color: "text-emerald-500" },
        { label: "Subjects", value: stats.subjects, icon: BookOpen, color: "text-amber-500" },
        { label: "Avg Engagement", value: stats.avgEngagement, icon: Shield, color: "text-red-500" },
      ]
    : [];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-2">
              <Shield className="w-8 h-8 text-brand-500" />
              Admin Panel
            </h1>
            <p className="text-[var(--text-secondary)]">Platform overview and management</p>
          </div>

          {error && <p className="text-red-500 text-sm glass-card">{error}</p>}

          {stats && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((c, i) => (
                  <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card !p-5">
                    <c.icon className={`w-8 h-8 ${c.color} mb-3`} />
                    <p className="text-3xl font-bold">{c.value}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{c.label}</p>
                  </motion.div>
                ))}
              </div>
              <div className="glass-card">
                <h2 className="font-semibold mb-4">Users by Role</h2>
                <div className="flex flex-wrap gap-4">
                  {stats.usersByRole.map((r) => (
                    <div key={r.role} className="px-6 py-4 rounded-xl bg-brand-500/10">
                      <p className="text-2xl font-bold">{r._count}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{r.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
