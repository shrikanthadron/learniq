"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Target, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { getActiveUser } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/ui/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { getUserExamGoal } from "@/lib/hooks";

interface Subject {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon?: string | null;
  examMode?: string | null;
  chapters?: { topics: { id: string; title: string }[] }[];
}

interface UserSubject {
  subjectId: string;
  progressPercent: number;
  subject: Subject;
}

export default function SubjectsPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const user = getActiveUser(authUser);
  const examGoal = getUserExamGoal(user.goals as Record<string, unknown> | null);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [continuingId, setContinuingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [allSubjects, mySubjects] = await Promise.all([
        api<Subject[]>(`/subjects?exam=${examGoal}`),
        api<UserSubject[]>("/subjects/my").catch(() => [] as UserSubject[]),
      ]);
      setSubjects(allSubjects);
      const map: Record<string, number> = {};
      for (const us of mySubjects) {
        map[us.subjectId] = us.progressPercent;
      }
      setProgressMap(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  }, [examGoal]);

  useEffect(() => {
    load();
  }, [load]);

  const continueLearning = async (subject: Subject) => {
    setContinuingId(subject.id);
    setError("");
    try {
      const firstTopic = subject.chapters?.[0]?.topics?.[0]?.title || subject.name;
      await api("/subjects/enroll", {
        method: "POST",
        body: JSON.stringify({ subjectId: subject.id, dailyStudyHours: 2 }),
      });
      const params = new URLSearchParams({
        subjectId: subject.id,
        subject: subject.name,
        topic: firstTopic,
      });
      router.push(`/quizzes?${params.toString()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start learning path");
    } finally {
      setContinuingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-brand-500" />
              Learning Paths
            </h1>
            <p className="text-[var(--text-secondary)] flex items-center gap-2 mt-1">
              <Target className="w-4 h-4 text-brand-500" />
              Subjects for your goal: <span className="font-semibold text-brand-500">{examGoal}</span>
              <span className="text-xs">(change in Settings → Goals)</span>
            </p>
          </div>

          {error && <p className="text-red-500 text-sm glass-card">{error}</p>}

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : subjects.length === 0 ? (
            <p className="glass-card text-center text-[var(--text-secondary)] py-8">
              No subjects found for {examGoal}. Update your exam goal in Settings.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((s, i) => {
                const progress = progressMap[s.id] ?? 0;
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-4xl">{s.icon || "📚"}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{s.name}</h3>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {s.examMode ? `${s.examMode} prep` : examGoal} path
                        </p>
                      </div>
                    </div>
                    <div className="progress-bar mb-2">
                      <div className="progress-fill" style={{ width: `${progress}%`, background: s.color }} />
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{Math.round(progress)}% complete</p>
                    <button
                      type="button"
                      onClick={() => continueLearning(s)}
                      disabled={continuingId === s.id}
                      className="btn-primary w-full mt-4 text-sm flex items-center justify-center gap-2"
                    >
                      {continuingId === s.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Starting...
                        </>
                      ) : (
                        "Continue Learning"
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
