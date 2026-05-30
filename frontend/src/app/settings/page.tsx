"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/ui/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { getActiveUser } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { getUserExamGoal } from "@/lib/hooks";

export default function SettingsPage() {
  const { user: authUser, setUser } = useAuth();
  const user = getActiveUser(authUser);
  const { theme, toggle } = useTheme();

  const goals = (user.goals || {}) as Record<string, unknown>;
  const [name, setName] = useState(user.name);
  const [exam, setExam] = useState(getUserExamGoal(goals));
  const [dailyHours, setDailyHours] = useState(Number(goals.dailyHours) || 3);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const saveGoals = async () => {
    setSaving(true);
    setMessage("");
    const newGoals = { ...goals, exam: exam.toUpperCase(), dailyHours };
    try {
      const updated = await api<typeof user>("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ name, goals: newGoals }),
      });
      setUser(updated);
      setMessage(`Saved! Subjects page will show paths for ${exam.toUpperCase()}.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-2xl space-y-8">
          <h1 className="font-display text-3xl font-bold">Settings</h1>

          <div className="glass-card space-y-4">
            <h2 className="font-semibold">Profile</h2>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
            <input className="input-field" value={user.email} disabled />
          </div>

          <div className="glass-card space-y-4">
            <h2 className="font-semibold">Exam goal</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Subjects page shows courses matching this exam (JEE, NEET, GATE, CET).
            </p>
            <select className="input-field" value={exam} onChange={(e) => setExam(e.target.value)}>
              <option value="JEE">JEE</option>
              <option value="NEET">NEET</option>
              <option value="GATE">GATE</option>
              <option value="CET">CET</option>
            </select>
            <input
              className="input-field"
              type="number"
              min={1}
              max={12}
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value))}
            />
            <button type="button" onClick={saveGoals} disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Save Goals"}
            </button>
            {message && <p className="text-sm text-brand-500">{message}</p>}
          </div>

          <div className="glass-card flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Appearance</h2>
              <p className="text-sm text-[var(--text-secondary)]">Current: {theme} mode</p>
            </div>
            <button type="button" onClick={toggle} className="btn-secondary">
              Toggle Theme
            </button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
