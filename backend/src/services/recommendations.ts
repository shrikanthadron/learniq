import { Difficulty, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { getStudyRecommendations } from "./ai.js";

export function adjustDifficulty(accuracy: number): Difficulty {
  if (accuracy >= 85) return "HARD";
  if (accuracy >= 60) return "MEDIUM";
  return "EASY";
}

export async function buildAdaptiveRecommendations(userId: string) {
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },
    orderBy: { completedAt: "desc" },
    take: 10,
    include: { quiz: { include: { topic: true, subject: true } } },
  });

  const userSubjects = await prisma.userSubject.findMany({
    where: { userId },
    include: { subject: { include: { chapters: { include: { topics: true } } } } },
  });

  const weakTopics: string[] = [];
  for (const us of userSubjects) {
    const wt = us.weakTopics as string[] | null;
    if (wt?.length) weakTopics.push(...wt);
  }

  const recentScores = attempts.map((a) => a.accuracy);
  const avgAccuracy = recentScores.length
    ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
    : 70;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const goals = (user?.goals as { exam?: string; target?: string })?.exam || "General improvement";

  const aiRec = await getStudyRecommendations(weakTopics, goals, recentScores);
  const nextDifficulty = adjustDifficulty(avgAccuracy);

  await prisma.recommendation.deleteMany({
    where: { userId, type: "daily" },
  });

  const rec = await prisma.recommendation.create({
    data: {
      userId,
      type: "daily",
      title: "Today's Study Plan",
      content: {
        dailyTopics: aiRec.dailyTopics,
        revisionPlan: aiRec.revisionPlan,
        practiceSessions: aiRec.practiceSessions,
        suggestedDifficulty: nextDifficulty,
        examReadiness: Math.min(99, Math.round(avgAccuracy * 0.9 + 10)),
      } as Prisma.InputJsonValue,
      priority: 1,
    },
  });

  return { recommendation: rec, nextDifficulty, examReadiness: Math.min(99, Math.round(avgAccuracy * 0.9 + 10)) };
}

export function spacedRepetitionNext(
  quality: number,
  interval: number,
  ease: number
): { interval: number; ease: number; nextReview: Date } {
  let newEase = ease;
  let newInterval = interval;

  if (quality >= 3) {
    if (interval === 1) newInterval = 1;
    else if (interval === 2) newInterval = 6;
    else newInterval = Math.round(interval * ease);
    newEase = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  } else {
    newInterval = 1;
  }

  newEase = Math.max(1.3, newEase);
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);
  return { interval: newInterval, ease: newEase, nextReview };
}
