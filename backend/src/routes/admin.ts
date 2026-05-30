import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(authenticate, requireRole("TEACHER", "ADMIN"));

router.get("/stats", async (_req, res) => {
  const [users, quizzes, attempts, subjects] = await Promise.all([
    prisma.user.count(),
    prisma.quiz.count(),
    prisma.quizAttempt.count(),
    prisma.subject.count(),
  ]);

  const students = await prisma.user.count({ where: { role: "STUDENT" } });
  const recentAttempts = await prisma.quizAttempt.findMany({
    take: 10,
    orderBy: { completedAt: "desc" },
    include: { quiz: true },
  });

  const usersByRole = await prisma.user.groupBy({
    by: ["role"],
    _count: true,
  });

  res.json({
    users,
    students,
    quizzes,
    attempts,
    subjects,
    usersByRole,
    recentAttempts,
    avgEngagement: attempts > 0 ? Math.round(attempts / Math.max(students, 1)) : 0,
  });
});

router.get("/users", async (_req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, role: true, xp: true, streakDays: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
});

router.post("/quizzes", async (req, res) => {
  const { title, subjectId, topicId, difficulty, questions } = req.body;
  const quiz = await prisma.quiz.create({
    data: {
      title,
      subjectId,
      topicId,
      difficulty,
      createdById: req.user!.userId,
      questions: questions ? { create: questions } : undefined,
    },
    include: { questions: true },
  });
  res.status(201).json(quiz);
});

export default router;
