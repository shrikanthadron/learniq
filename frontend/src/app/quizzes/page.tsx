"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Brain, Plus, Clock, Sparkles, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/ui/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

interface Quiz {
  id: string;
  title: string;
  description?: string;
  difficulty: string;
  timeLimitSec?: number;
  createdById?: string | null;
  _count?: { questions: number };
  subject?: { name: string; color: string };
}

function QuizzesContent() {
  const searchParams = useSearchParams();
  const subjectIdParam = searchParams.get("subjectId");
  const subjectName = searchParams.get("subject") || "";
  const topicParam = searchParams.get("topic") || "";

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState(topicParam || "");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (topicParam) setTopic(topicParam);
  }, [topicParam]);

  useEffect(() => {
    const q = subjectIdParam ? `?subjectId=${subjectIdParam}` : "";
    api<Quiz[]>(`/quizzes${q}`)
      .then(setQuizzes)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load quizzes"));
  }, [subjectIdParam]);

  const generateQuiz = async () => {
    if (!topic.trim()) {
      setError("Enter a topic to generate a quiz");
      return;
    }
    setGenerating(true);
    setError("");
    try {
      const quiz = await api<Quiz>("/quizzes/generate", {
        method: "POST",
        body: JSON.stringify({
          topic,
          subjectId: subjectIdParam || undefined,
          count: 15,
          difficulty: "MEDIUM",
          types: ["MCQ", "TRUE_FALSE", "FILL_BLANK"],
          timeLimitSec: 900,
        }),
      });
      window.location.href = `/quizzes/${quiz.id}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Quiz generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const deleteQuiz = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this quiz permanently?")) return;
    setDeletingId(id);
    setError("");
    try {
      await api(`/quizzes/${id}`, { method: "DELETE" });
      setQuizzes((q) => q.filter((x) => x.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold">Quizzes</h1>
              <p className="text-[var(--text-secondary)]">
                {subjectName
                  ? `Practice for ${subjectName}${topicParam ? ` — ${topicParam}` : ""}`
                  : "AI-generated adaptive assessments"}
              </p>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm glass-card">{error}</p>}

          <div className="glass-card">
            <h2 className="font-semibold flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-brand-500" />
              Generate New Quiz
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Generates 15 questions · ~15 min timer
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter topic (e.g. Organic Chemistry)"
                className="input-field flex-1"
              />
              <button onClick={generateQuiz} disabled={generating} className="btn-primary whitespace-nowrap">
                {generating ? "Generating..." : <><Plus className="w-4 h-4 inline mr-1" /> Generate Quiz</>}
              </button>
            </div>
          </div>

          {quizzes.length === 0 ? (
            <p className="text-center text-[var(--text-secondary)] glass-card py-8">
              No quizzes yet. Generate one above or complete seed data setup.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {quizzes.map((quiz, i) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link href={`/quizzes/${quiz.id}`} className="glass-card block group relative">
                    {user && quiz.createdById === user.id && (
                      <button
                        type="button"
                        onClick={(e) => deleteQuiz(quiz.id, e)}
                        disabled={deletingId === quiz.id}
                        className="absolute top-3 right-3 p-2 rounded-lg hover:bg-red-500/10 text-red-500 z-10"
                        title="Delete quiz"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <div className="flex items-start justify-between">
                      <Brain className="w-8 h-8 text-brand-500" />
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        quiz.difficulty === "EASY" ? "bg-emerald-500/15 text-emerald-500" :
                        quiz.difficulty === "HARD" ? "bg-red-500/15 text-red-500" :
                        "bg-amber-500/15 text-amber-500"
                      }`}>
                        {quiz.difficulty}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mt-3 group-hover:text-brand-500 transition">{quiz.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{quiz.description}</p>
                    <div className="flex gap-4 mt-4 text-xs text-[var(--text-secondary)]">
                      <span>{quiz._count?.questions || 0} questions</span>
                      {quiz.timeLimitSec && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {Math.round(quiz.timeLimitSec / 60)} min
                        </span>
                      )}
                      {quiz.subject && (
                        <span style={{ color: quiz.subject.color }}>{quiz.subject.name}</span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export default function QuizzesPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    }>
      <QuizzesContent />
    </Suspense>
  );
}
