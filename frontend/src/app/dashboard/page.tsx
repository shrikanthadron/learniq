"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain, Calendar, TrendingUp, Flame, Target, ArrowRight, Sparkles, Clock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getActiveUser } from "@/components/auth/ProtectedRoute";
import { api } from "@/lib/api";
import { getUserExamGoal } from "@/lib/hooks";

interface Recommendations {
  dailyTopics: string[];
  revisionPlan: string;
  practiceSessions: string[];
  suggestedDifficulty: string;
  examReadiness: number;
}

interface UserSubject {
  subjectId: string;
  progressPercent: number;
  subject: { id: string; name: string; color: string; icon?: string | null };
}

const defaultRec: Recommendations = {
  dailyTopics: [],
  revisionPlan: "Loading your study plan...",
  practiceSessions: [],
  suggestedDifficulty: "MEDIUM",
  examReadiness: 0,
};

export default function DashboardPage() {
  const { user: authUser } = useAuth();
  const user = getActiveUser(authUser);
  const examGoal = getUserExamGoal(user.goals as Record<string, unknown> | null);
  const [rec, setRec] = useState<Recommendations>(defaultRec);
  const [subjects, setSubjects] = useState<UserSubject[]>([]);

  useEffect(() => {
    api<{ recommendation: { content: Recommendations } }>("/analytics/recommendations")
      .then((r) => {
        if (r.recommendation?.content) setRec(r.recommendation.content as Recommendations);
      })
      .catch(() => {});

    api<UserSubject[]>("/subjects/my")
      .then(setSubjects)
      .catch(() => {});
  }, []);

  const stats = [
    { label: "Study Streak", value: `${user.streakDays} days`, icon: Flame, color: "text-orange-500" },
    { label: "XP Points", value: user.xp.toLocaleString(), icon: Sparkles, color: "text-brand-500" },
    { label: "Exam Readiness", value: `${rec.examReadiness}%`, icon: Target, color: "text-emerald-500" },
    { label: "Level", value: user.level, icon: TrendingUp, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="font-display text-3xl font-bold">
          Welcome back, {user.name.split(" ")[0]} 👋
        </motion.h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Your {examGoal} study plan for today
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card !p-4">
            <s.icon className={`w-6 h-6 ${s.color} mb-2`} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-[var(--text-secondary)]">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-500" />
              AI Daily Recommendations
            </h2>
            <span className="text-xs px-3 py-1 rounded-full bg-brand-500/15 text-brand-500">
              {rec.suggestedDifficulty} difficulty
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-4">{rec.revisionPlan}</p>
          {rec.dailyTopics.length > 0 ? (
            <div className="space-y-2">
              {rec.dailyTopics.map((topic) => (
                <div key={topic} className="flex items-center gap-3 p-3 rounded-xl bg-brand-500/5">
                  <div className="w-2 h-2 rounded-full bg-brand-500" />
                  <span className="text-sm">{topic}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">Complete a quiz to get personalized topics.</p>
          )}
          {rec.practiceSessions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--glass-border)]">
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Practice Sessions</p>
              {rec.practiceSessions.map((s) => (
                <p key={s} className="text-sm flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-cyan-500" /> {s}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Link href="/quizzes" className="glass-card block group hover:border-brand-500/30">
            <Brain className="w-8 h-8 text-brand-500 mb-2" />
            <h3 className="font-semibold">Take a Quiz</h3>
            <p className="text-sm text-[var(--text-secondary)]">Adaptive AI-generated quizzes</p>
            <ArrowRight className="w-5 h-5 mt-2 group-hover:translate-x-1 transition" />
          </Link>
          <Link href="/planner" className="glass-card block group">
            <Calendar className="w-8 h-8 text-purple-500 mb-2" />
            <h3 className="font-semibold">Study Planner</h3>
            <p className="text-sm text-[var(--text-secondary)]">Schedule & Pomodoro</p>
          </Link>
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-lg mb-4">Your Subjects</h2>
        {subjects.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] glass-card py-6 text-center">
            <Link href="/subjects" className="text-brand-500 underline">Enroll in subjects</Link> to track progress here.
          </p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {subjects.map((us) => (
              <div key={us.subjectId} className="glass-card">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{us.subject.icon || "📚"}</span>
                  <div>
                    <h3 className="font-semibold">{us.subject.name}</h3>
                    <p className="text-xs text-[var(--text-secondary)]">{Math.round(us.progressPercent)}% complete</p>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${us.progressPercent}%`, background: us.subject.color }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
