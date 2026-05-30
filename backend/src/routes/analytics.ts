import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { buildAdaptiveRecommendations } from "../services/recommendations.js";

const router = Router();
router.use(authenticate);

router.get("/dashboard", async (req, res) => {
  const userId = req.user!.userId;

  const [attempts, sessions, progress, user, leaderboard] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { completedAt: "asc" },
      take: 30,
      include: { quiz: { include: { subject: true, topic: true } } },
    }),
    prisma.studySession.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 50,
    }),
    prisma.progressRecord.findMany({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.leaderboardEntry.findMany({ orderBy: { xp: "desc" }, take: 10 }),
  ]);

  const accuracyTrend = attempts.map((a) => ({
    date: a.completedAt.toISOString().split("T")[0],
    accuracy: Math.round(a.accuracy),
    quiz: a.quiz.title,
  }));

  const topicMap = new Map<string, { correct: number; total: number }>();
  for (const a of attempts) {
    const topic = a.quiz.topic?.title || a.quiz.subject?.name || "General";
    const prev = topicMap.get(topic) || { correct: 0, total: 0 };
    prev.correct += a.accuracy;
    prev.total += 1;
    topicMap.set(topic, prev);
  }

  const topicStrengths = Array.from(topicMap.entries()).map(([topic, v]) => ({
    topic,
    score: Math.round(v.correct / v.total),
    strength: v.correct / v.total >= 75 ? "strong" : v.correct / v.total >= 50 ? "moderate" : "weak",
  }));

  const timeByDay = new Map<string, number>();
  for (const s of sessions) {
    const day = s.startedAt.toISOString().split("T")[0];
    timeByDay.set(day, (timeByDay.get(day) || 0) + s.durationMin);
  }
  const studyTime = Array.from(timeByDay.entries()).map(([date, minutes]) => ({ date, minutes }));

  const avgAccuracy = attempts.length
    ? attempts.reduce((s, a) => s + a.accuracy, 0) / attempts.length
    : 0;
  const examReadiness = Math.min(99, Math.round(avgAccuracy * 0.85 + (user?.streakDays || 0) * 2));
  const consistencyScore = Math.min(100, (user?.streakDays || 0) * 10 + attempts.length * 2);

  const completionPercent =
    progress.length > 0
      ? progress.reduce((s, p) => s + p.percent, 0) / progress.length
      : 45;

  res.json({
    accuracyTrend,
    topicStrengths,
    studyTime,
    quizHistory: attempts.slice(-10).reverse(),
    examReadiness,
    consistencyScore,
    completionPercent,
    streakDays: user?.streakDays || 0,
    xp: user?.xp || 0,
    level: user?.level || 1,
    leaderboard,
    predictedScore: examReadiness,
  });
});

router.get("/recommendations", async (req, res) => {
  const result = await buildAdaptiveRecommendations(req.user!.userId);
  res.json(result);
});

router.get("/achievements", async (req, res) => {
  const earned = await prisma.userAchievement.findMany({
    where: { userId: req.user!.userId },
    include: { achievement: true },
  });
  const all = await prisma.achievement.findMany();
  res.json({ earned, all });
});

export default router;
