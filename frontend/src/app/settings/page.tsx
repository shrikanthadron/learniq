"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bell, BookOpen, Moon, Sun, Target, User, Zap, CheckCircle2 } from "lucide-react";
import { DashboardLayout } from "@/components/ui/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { getActiveUser } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { getUserExamGoal } from "@/lib/hooks";
import { EXAM_OPTIONS, GATE_BRANCHES, getUserGateBranch } from "@/lib/exam-config";
import { requestNotificationPermission } from "@/lib/pomodoro-alerts";
import clsx from "clsx";

export default function SettingsPage() {
  const { user: authUser, setUser } = useAuth();
  const user = getActiveUser(authUser);
  const { theme, toggle } = useTheme();

  const goals = (user.goals || {}) as Record<string, unknown>;
  const [name, setName] = useState(user.name);
  const [exam, setExam] = useState(getUserExamGoal(goals));
  const [gateBranch, setGateBranch] = useState(getUserGateBranch(goals));
  const [dailyHours, setDailyHours] = useState(Number(goals.dailyHours) || 3);
  const [reminders, setReminders] = useState(Boolean(goals.reminders ?? true));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const previewSubjects = useMemo(() => {
    const opt = EXAM_OPTIONS.find((e) => e.id === exam);
    if (exam === "GATE") {
      const branch = GATE_BRANCHES.find((b) => b.slug === gateBranch);
      return branch ? [branch.name] : GATE_BRANCHES.map((b) => b.name);
    }
    return opt?.subjects.map((s) => s.charAt(0).toUpperCase() + s.slice(1)) || [];
  }, [exam, gateBranch]);

  const saveGoals = async () => {
    setSaving(true);
    setMessage("");
    const newGoals = {
      ...goals,
      exam: exam.toUpperCase(),
      gateBranch: exam === "GATE" ? gateBranch : undefined,
      dailyHours,
      reminders,
    };
    try {
      const updated = await api<typeof user>("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ name, goals: newGoals }),
      });
      setUser(updated);
      setMessageType("success");
      setMessage(`Saved! Your ${exam} learning path is updated.`);
    } catch (e) {
      setMessageType("error");
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-3xl space-y-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Settings</h1>
            <p className="text-[var(--text-secondary)]">Customize your profile, exam path, and study preferences</p>
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-brand-500" /> Profile
            </h2>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
            <input className="input-field opacity-70" value={user.email} disabled />
            <div className="flex items-center gap-4 p-3 rounded-xl bg-brand-500/10">
              <Zap className="w-8 h-8 text-brand-500" />
              <div>
                <p className="font-semibold">Level {user.level}</p>
                <p className="text-sm text-[var(--text-secondary)]">{user.xp} XP · {user.streakDays} day streak</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-500" /> Exam Goal
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">Tap an exam to set your learning path</p>
            <div className="grid grid-cols-2 gap-3">
              {EXAM_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setExam(opt.id)}
                  className={clsx(
                    "p-4 rounded-xl border text-left transition-all",
                    exam === opt.id
                      ? "border-brand-500 bg-brand-500/15 ring-2 ring-brand-500/30"
                      : "border-[var(--glass-border)] hover:border-brand-500/50"
                  )}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <p className="font-semibold mt-2">{opt.label}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{opt.description}</p>
                </button>
              ))}
            </div>

            {exam === "GATE" && (
              <div className="space-y-3 pt-2">
                <p className="text-sm font-medium">Select Engineering Branch</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GATE_BRANCHES.map((branch) => (
                    <button
                      key={branch.slug}
                      type="button"
                      onClick={() => setGateBranch(branch.slug)}
                      className={clsx(
                        "p-3 rounded-xl border text-left text-sm transition",
                        gateBranch === branch.slug
                          ? "border-brand-500 bg-brand-500/15"
                          : "border-[var(--glass-border)] hover:bg-brand-500/5"
                      )}
                    >
                      <span className="text-xl">{branch.icon}</span>
                      <p className="font-medium mt-1 leading-tight">{branch.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                Daily study hours: <span className="font-semibold text-brand-500">{dailyHours}h</span>
              </label>
              <input
                type="range"
                min={1}
                max={12}
                value={dailyHours}
                onChange={(e) => setDailyHours(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
                <span>1h</span><span>6h</span><span>12h</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--glass-border)]/20 border border-[var(--glass-border)]">
              <p className="text-sm font-medium flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-brand-500" /> Preview — Subjects you&apos;ll see
              </p>
              <div className="flex flex-wrap gap-2">
                {previewSubjects.map((s) => (
                  <span key={s} className="text-xs px-3 py-1 rounded-full bg-brand-500/15 text-brand-500 font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <button type="button" onClick={saveGoals} disabled={saving} className="btn-primary w-full sm:w-auto">
              {saving ? "Saving..." : "Save Goals"}
            </button>
            {message && (
              <p className={clsx("text-sm flex items-center gap-2", messageType === "success" ? "text-emerald-500" : "text-red-500")}>
                {messageType === "success" && <CheckCircle2 className="w-4 h-4" />}
                {message}
              </p>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5 text-brand-500" /> Notifications
            </h2>
            <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--glass-border)] cursor-pointer">
              <div>
                <span className="text-sm block">Daily study reminders</span>
                <span className="text-xs text-[var(--text-secondary)]">7:00 AM, 3:00 PM & 7:00 PM — shows hours studied today</span>
              </div>
              <input
                type="checkbox"
                checked={reminders}
                onChange={(e) => setReminders(e.target.checked)}
                className="w-5 h-5 accent-brand-500 shrink-0 ml-3"
              />
            </label>
            {reminders && (
              <button
                type="button"
                onClick={() => requestNotificationPermission()}
                className="text-sm text-brand-500 hover:underline"
              >
                Enable browser notifications
              </button>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card flex items-center justify-between">
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-500" />}
                Appearance
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">Current: {theme} mode</p>
            </div>
            <button type="button" onClick={toggle} className="btn-secondary">
              Switch to {theme === "dark" ? "Light" : "Dark"}
            </button>
          </motion.div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
