"use client";

import { motion } from "framer-motion";
import { Trophy, Lock } from "lucide-react";
import { DashboardLayout } from "@/components/ui/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const achievements = [
  { name: "First Steps", description: "Complete your first quiz", icon: "🎯", earned: true, xp: 50 },
  { name: "Streak Master", description: "7-day study streak", icon: "🔥", earned: true, xp: 100 },
  { name: "Quiz Champion", description: "Score 90%+ on a quiz", icon: "🏆", earned: false, xp: 150 },
  { name: "Night Owl", description: "Study after 10 PM", icon: "🦉", earned: false, xp: 75 },
  { name: "Subject Master", description: "Complete 100% of a subject", icon: "📚", earned: false, xp: 200 },
  { name: "Focus Hero", description: "Complete 10 Pomodoro sessions", icon: "⏱️", earned: false, xp: 80 },
];

export default function AchievementsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-2">
              <Trophy className="w-8 h-8 text-amber-500" />
              Achievements & Badges
            </h1>
            <p className="text-[var(--text-secondary)]">Earn XP and unlock rewards as you learn</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((a, i) => (
              <motion.div
                key={a.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className={`glass-card relative ${!a.earned ? "opacity-60" : ""}`}
              >
                {!a.earned && (
                  <Lock className="absolute top-4 right-4 w-5 h-5 text-[var(--text-secondary)]" />
                )}
                <span className="text-4xl">{a.icon}</span>
                <h3 className="font-semibold mt-3">{a.name}</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{a.description}</p>
                <p className="text-xs text-brand-500 mt-3 font-medium">+{a.xp} XP</p>
                {a.earned && (
                  <span className="absolute top-4 right-4 text-xs bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded-full">
                    Earned
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
