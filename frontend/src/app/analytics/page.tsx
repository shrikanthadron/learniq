"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Target, Flame, TrendingUp, Award, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { AccuracyChart, StudyTimeChart, TopicRadarChart, TopicBarChart } from "@/components/charts/AnalyticsCharts";
import { DashboardLayout } from "@/components/ui/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

interface Analytics {
  accuracyTrend: { date: string; accuracy: number }[];
  topicStrengths: { topic: string; score: number; strength: string }[];
  studyTime: { date: string; minutes: number }[];
  examReadiness: number;
  consistencyScore: number;
  completionPercent: number;
  streakDays: number;
  predictedScore: number;
  leaderboard: { userName: string; xp: number; rank?: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Analytics>("/analytics/dashboard")
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error || !data) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <p className="text-red-500 glass-card text-center py-8">{error || "No analytics data"}</p>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const metrics = [
    { label: "Exam Readiness", value: `${data.examReadiness}%`, icon: Target, color: "from-emerald-500 to-teal-500" },
    { label: "Consistency", value: `${data.consistencyScore}%`, icon: TrendingUp, color: "from-brand-500 to-purple-500" },
    { label: "Completion", value: `${Math.round(data.completionPercent)}%`, icon: BarChart3, color: "from-cyan-500 to-blue-500" },
    { label: "Streak", value: `${data.streakDays} days`, icon: Flame, color: "from-orange-500 to-red-500" },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Performance Analytics</h1>
            <p className="text-[var(--text-secondary)]">
              Predicted exam score: <span className="font-semibold text-brand-500">{data.predictedScore}%</span>
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m, i) => (
              <motion.div key={m.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="glass-card !p-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center mb-2`}>
                  <m.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold">{m.value}</p>
                <p className="text-xs text-[var(--text-secondary)]">{m.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass-card">
              <h2 className="font-semibold mb-4">Accuracy Trends</h2>
              <AccuracyChart data={data.accuracyTrend} />
            </div>
            <div className="glass-card">
              <h2 className="font-semibold mb-4">Study Time (minutes)</h2>
              <StudyTimeChart data={data.studyTime} />
            </div>
            <div className="glass-card">
              <h2 className="font-semibold mb-4">Topic Strengths</h2>
              <TopicRadarChart data={data.topicStrengths} />
            </div>
            <div className="glass-card">
              <h2 className="font-semibold mb-4">Weak vs Strong Topics</h2>
              <TopicBarChart data={data.topicStrengths} />
            </div>
          </div>

          <div className="glass-card">
            <h2 className="font-semibold flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-amber-500" />
              Leaderboard
            </h2>
            <div className="space-y-3">
              {data.leaderboard.map((entry, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-brand-500/5">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-gray-400 text-white" : "bg-amber-700/50 text-white"
                    }`}>
                      {i + 1}
                    </span>
                    <span className="font-medium">{entry.userName}</span>
                  </div>
                  <span className="text-brand-500 font-semibold">{entry.xp} XP</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
