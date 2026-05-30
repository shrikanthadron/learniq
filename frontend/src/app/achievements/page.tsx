"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Lock, Loader2, Award } from "lucide-react";
import { DashboardLayout } from "@/components/ui/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  badgeColor: string;
}

interface Earned {
  achievementId: string;
  earnedAt: string;
  achievement: Achievement;
}

export default function AchievementsPage() {
  const { user } = useAuth();
  const [earned, setEarned] = useState<Earned[]>([]);
  const [all, setAll] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ earned: Earned[]; all: Achievement[] }>("/analytics/achievements")
      .then((data) => {
        setEarned(data.earned);
        setAll(data.all);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const earnedIds = new Set(earned.map((e) => e.achievementId));
  const totalXp = earned.reduce((s, e) => s + e.achievement.xpReward, 0);

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

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="glass-card text-center">
              <p className="text-3xl font-bold gradient-text">{earned.length}/{all.length}</p>
              <p className="text-sm text-[var(--text-secondary)]">Badges Earned</p>
            </div>
            <div className="glass-card text-center">
              <p className="text-3xl font-bold gradient-text">{totalXp}</p>
              <p className="text-sm text-[var(--text-secondary)]">Achievement XP</p>
            </div>
            <div className="glass-card text-center">
              <p className="text-3xl font-bold gradient-text">{user?.level ?? 1}</p>
              <p className="text-sm text-[var(--text-secondary)]">Your Level</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : (
            <>
              <div>
                <h2 className="font-semibold flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-brand-500" /> Your Badges
                </h2>
                {earned.length === 0 ? (
                  <p className="glass-card text-center text-[var(--text-secondary)] py-8">
                    Complete a quiz or Pomodoro session to earn your first badge!
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {earned.map((e, i) => (
                      <motion.div
                        key={e.achievementId}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.06 }}
                        className="glass-card relative border-emerald-500/30"
                      >
                        <span className="absolute top-4 right-4 text-xs bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded-full">
                          Earned
                        </span>
                        <span className="text-4xl">{e.achievement.icon}</span>
                        <h3 className="font-semibold mt-3">{e.achievement.name}</h3>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">{e.achievement.description}</p>
                        <p className="text-xs text-brand-500 mt-3 font-medium">+{e.achievement.xpReward} XP</p>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                          {new Date(e.earnedAt).toLocaleDateString()}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h2 className="font-semibold mb-4">All Achievements</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {all.map((a, i) => {
                    const isEarned = earnedIds.has(a.id);
                    return (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`glass-card relative ${!isEarned ? "opacity-60" : ""}`}
                      >
                        {!isEarned && (
                          <Lock className="absolute top-4 right-4 w-5 h-5 text-[var(--text-secondary)]" />
                        )}
                        <span className="text-4xl">{a.icon}</span>
                        <h3 className="font-semibold mt-3">{a.name}</h3>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">{a.description}</p>
                        <p className="text-xs mt-3 font-medium" style={{ color: a.badgeColor }}>
                          +{a.xpReward} XP
                        </p>
                        {isEarned && (
                          <span className="absolute top-4 right-4 text-xs bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded-full">
                            ✓
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
