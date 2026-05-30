"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle, XCircle, ChevronRight, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import { DashboardLayout } from "@/components/ui/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

interface Question {
  id: string;
  type: string;
  text: string;
  options?: string[];
  difficulty: string;
  points: number;
}

interface Quiz {
  id: string;
  title: string;
  timeLimitSec?: number;
  questions: Question[];
}

export default function QuizPage() {
  const { id } = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    accuracy: number;
    xpGain: number;
    explanations: { question: { text: string; explanation: string; correctAnswer: string }; isCorrect: boolean }[];
  } | null>(null);

  useEffect(() => {
    api<Quiz>(`/quizzes/${id}`)
      .then((q) => {
        setQuiz(q);
        setTimeLeft(q.timeLimitSec || q.questions.length * 60);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load quiz"));
  }, [id]);

  useEffect(() => {
    if (!timeLeft || submitted) return;
    const t = setInterval(() => setTimeLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLeft, submitted]);

  const submit = useCallback(async () => {
    if (!quiz) return;
    setSubmitted(true);
    const timeSpent = (quiz.timeLimitSec || 600) - timeLeft;
    const answerList = Object.entries(answers).map(([questionId, userAnswer]) => ({ questionId, userAnswer }));

    try {
      const res = await api<{
        attempt: { accuracy: number };
        xpGain: number;
        explanations: { question: { text: string; explanation: string; correctAnswer: string }; isCorrect: boolean }[];
      }>(`/quizzes/${id}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers: answerList, timeSpentSec: timeSpent }),
      });
      setResult({ accuracy: res.attempt.accuracy, xpGain: res.xpGain, explanations: res.explanations });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit quiz");
      setSubmitted(false);
    }
  }, [quiz, answers, timeLeft, id]);

  useEffect(() => {
    if (timeLeft === 0 && quiz && !submitted) submit();
  }, [timeLeft, quiz, submitted, submit]);

  if (error && !quiz) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="max-w-md mx-auto glass-card text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button type="button" onClick={() => router.push("/quizzes")} className="btn-primary">
              Back to Quizzes
            </button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!quiz) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const q = quiz.questions[current];

  if (submitted && result) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto glass-card text-center">
            <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold">Quiz Complete!</h1>
            <p className="text-5xl font-bold gradient-text my-4">{Math.round(result.accuracy)}%</p>
            <p className="text-[var(--text-secondary)]">+{result.xpGain} XP earned</p>
            <div className="mt-8 space-y-4 text-left">
              {result.explanations.map((ex, i) => (
                <div key={i} className="p-4 rounded-xl bg-brand-500/5">
                  <div className="flex items-start gap-2">
                    {ex.isCorrect ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                    <div>
                      <p className="text-sm font-medium">{ex.question?.text}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{ex.question?.explanation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => router.push("/quizzes")} className="btn-primary inline-block mt-8">
              Back to Quizzes
            </button>
          </motion.div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold">{quiz.title}</h1>
            <div className="flex items-center gap-2 text-lg font-mono">
              <Clock className="w-5 h-5 text-brand-500" />
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </div>
          </div>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }} />
          </div>
          <p className="text-sm text-[var(--text-secondary)]">Question {current + 1} of {quiz.questions.length}</p>

          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card"
            >
              <span className="text-xs px-2 py-1 rounded bg-brand-500/15 text-brand-500">{q.type.replace("_", " ")}</span>
              <h2 className="text-xl font-semibold mt-4 mb-6">{q.text}</h2>

              {q.type === "MCQ" && q.options && (
                <div className="space-y-3">
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                      className={`w-full text-left p-4 rounded-xl border transition ${
                        answers[q.id] === opt ? "border-brand-500 bg-brand-500/10" : "border-[var(--glass-border)] hover:border-brand-500/50"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.type === "TRUE_FALSE" && (
                <div className="flex gap-4">
                  {["true", "false"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAnswers({ ...answers, [q.id]: v })}
                      className={`flex-1 p-4 rounded-xl capitalize ${answers[q.id] === v ? "bg-brand-500 text-white" : "glass"}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}

              {(q.type === "FILL_BLANK" || q.type === "SHORT_ANSWER") && (
                <input
                  className="input-field"
                  placeholder="Your answer..."
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between">
            <button type="button" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)} className="btn-secondary disabled:opacity-50">
              Previous
            </button>
            {current < quiz.questions.length - 1 ? (
              <button type="button" onClick={() => setCurrent((c) => c + 1)} disabled={!answers[q.id]} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={submit} className="btn-primary">
                Submit Quiz
              </button>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
