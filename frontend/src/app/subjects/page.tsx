"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Target, Loader2, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { getActiveUser } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/ui/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { getUserExamGoal } from "@/lib/hooks";
import { GATE_BRANCHES, getUserGateBranch } from "@/lib/exam-config";
import clsx from "clsx";

interface Topic {
  id: string;
  title: string;
}

interface Subject {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon?: string | null;
  examMode?: string | null;
  chapters?: { topics: Topic[] }[];
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
  const goals = (user.goals || {}) as Record<string, unknown>;
  const examGoal = getUserExamGoal(goals);
  const gateBranch = getUserGateBranch(goals);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [topicProgress, setTopicProgress] = useState<Record<string, { percent: number; completed: boolean }>>({});
  const [selectedBranch, setSelectedBranch] = useState(gateBranch);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [continuingId, setContinuingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const branchParam = examGoal === "GATE" ? `&branch=${selectedBranch}` : "";
      const [allSubjects, mySubjects, syllabus] = await Promise.all([
        api<Subject[]>(`/subjects?exam=${examGoal}${branchParam}`),
        api<UserSubject[]>("/subjects/my").catch(() => [] as UserSubject[]),
        api<Record<string, { percent: number; completed: boolean }>>("/subjects/syllabus-progress").catch(() => ({})),
      ]);
      setSubjects(allSubjects);
      setTopicProgress(syllabus);
      const map: Record<string, number> = {};
      for (const us of mySubjects) map[us.subjectId] = us.progressPercent;
      setProgressMap(map);
      if (examGoal === "GATE" && allSubjects[0]) setExpandedSubject(allSubjects[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  }, [examGoal, selectedBranch]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleTopic = async (topicId: string, subjectId: string, completed: boolean) => {
    await api("/subjects/topic-progress", {
      method: "POST",
      body: JSON.stringify({ topicId, subjectId, percent: completed ? 100 : 0, completed }),
    });
    await load();
  };

  const continueLearning = async (subject: Subject, topic?: string) => {
    setContinuingId(subject.id);
    setError("");
    try {
      const firstTopic = topic || subject.chapters?.[0]?.topics?.[0]?.title || subject.name;
      await api("/subjects/enroll", {
        method: "POST",
        body: JSON.stringify({ subjectId: subject.id, dailyStudyHours: 2 }),
      });
      const params = new URLSearchParams({ subjectId: subject.id, subject: subject.name, topic: firstTopic });
      router.push(`/quizzes?${params.toString()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start learning path");
    } finally {
      setContinuingId(null);
    }
  };

  const isGate = examGoal === "GATE";

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
              {isGate ? "GATE branch syllabus tracker" : "Subjects"} for{" "}
              <span className="font-semibold text-brand-500">{examGoal}</span>
            </p>
          </div>

          {isGate && (
            <div className="glass-card">
              <p className="text-sm font-medium mb-3">Select Engineering Branch</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {GATE_BRANCHES.map((branch) => (
                  <button
                    key={branch.slug}
                    type="button"
                    onClick={() => setSelectedBranch(branch.slug)}
                    className={clsx(
                      "p-3 rounded-xl border text-left transition text-sm",
                      selectedBranch === branch.slug
                        ? "border-brand-500 bg-brand-500/15"
                        : "border-[var(--glass-border)] hover:bg-brand-500/5"
                    )}
                  >
                    <span className="text-xl">{branch.icon}</span>
                    <p className="font-medium mt-1">{branch.name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

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
            <div className="space-y-6">
              {subjects.map((s, i) => {
                const progress = progressMap[s.id] ?? 0;
                const topics = s.chapters?.flatMap((c) => c.topics) || [];
                const completedTopics = topics.filter((t) => topicProgress[t.id]?.completed).length;
                const expanded = expandedSubject === s.id;

                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="glass-card"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-4xl">{s.icon || "📚"}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{s.name}</h3>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {isGate
                            ? `${completedTopics}/${topics.length} syllabus topics completed`
                            : `${examGoal} prep path`}
                        </p>
                      </div>
                      {isGate && topics.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedSubject(expanded ? null : s.id)}
                          className="p-2 rounded-lg hover:bg-brand-500/10 text-brand-500"
                        >
                          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      )}
                    </div>

                    <div className="progress-bar mb-2">
                      <div className="progress-fill" style={{ width: `${progress}%`, background: s.color }} />
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">{Math.round(progress)}% complete</p>

                    {isGate && expanded && topics.length > 0 && (
                      <div className="space-y-2 mb-4 max-h-64 overflow-y-auto border-t border-[var(--glass-border)] pt-4">
                        {topics.map((topic) => {
                          const done = topicProgress[topic.id]?.completed;
                          return (
                            <label
                              key={topic.id}
                              className={clsx(
                                "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition",
                                done ? "bg-emerald-500/10" : "hover:bg-brand-500/5"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={!!done}
                                onChange={(e) => toggleTopic(topic.id, s.id, e.target.checked)}
                                className="w-4 h-4 accent-brand-500"
                              />
                              <span className={clsx("text-sm flex-1", done && "line-through opacity-70")}>
                                {topic.title}
                              </span>
                              {done && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => continueLearning(s)}
                      disabled={continuingId === s.id}
                      className="btn-primary w-full text-sm flex items-center justify-center gap-2"
                    >
                      {continuingId === s.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Starting...
                        </>
                      ) : (
                        "Start Quiz on This Subject"
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
