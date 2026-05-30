import { prisma } from "@/lib/prisma";

const ACHIEVEMENT_RULES = [
  { name: "First Steps", check: async (userId: string) => (await prisma.quizAttempt.count({ where: { userId } })) >= 1 },
  { name: "Streak Master", check: async (userId: string) => ((await prisma.user.findUnique({ where: { id: userId } }))?.streakDays || 0) >= 7 },
  { name: "Quiz Champion", check: async (userId: string) => (await prisma.quizAttempt.findFirst({ where: { userId, accuracy: { gte: 90 } } })) !== null },
  { name: "Night Owl", check: async (userId: string) => {
    const sessions = await prisma.studySession.findMany({ where: { userId }, take: 50, orderBy: { startedAt: "desc" } });
    return sessions.some((s) => new Date(s.startedAt).getHours() >= 22);
  }},
  { name: "Subject Master", check: async (userId: string) => (await prisma.userSubject.findFirst({ where: { userId, progressPercent: { gte: 100 } } })) !== null },
  { name: "Focus Hero", check: async (userId: string) => (await prisma.studySession.count({ where: { userId, pomodoro: true } })) >= 10 },
];

export async function checkAndAwardAchievements(userId: string): Promise<string[]> {
  const all = await prisma.achievement.findMany();
  const earned = await prisma.userAchievement.findMany({ where: { userId } });
  const earnedIds = new Set(earned.map((e) => e.achievementId));
  const newlyEarned: string[] = [];

  for (const rule of ACHIEVEMENT_RULES) {
    const achievement = all.find((a) => a.name === rule.name);
    if (!achievement || earnedIds.has(achievement.id)) continue;
    if (await rule.check(userId)) {
      await prisma.userAchievement.create({ data: { userId, achievementId: achievement.id } });
      await prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: achievement.xpReward } },
      });
      newlyEarned.push(achievement.name);
    }
  }

  return newlyEarned;
}
