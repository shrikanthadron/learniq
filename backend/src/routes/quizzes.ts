import { Router } from "express";
import { z } from "zod";
import { Difficulty, QuestionType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { generateQuizQuestions } from "../services/ai.js";
import { adjustDifficulty } from "../services/recommendations.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  const { subjectId, topicId, difficulty } = req.query;
  const quizzes = await prisma.quiz.findMany({
    where: {
      isPublished: true,
      ...(subjectId && { subjectId: String(subjectId) }),
      ...(topicId && { topicId: String(topicId) }),
      ...(difficulty && { difficulty: String(difficulty) as Difficulty }),
    },
    include: {
      subject: true,
      topic: true,
      _count: { select: { questions: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(quizzes);
});

router.get("/:id", async (req, res) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: req.params.id },
    include: {
      subject: true,
      topic: true,
      questions: {
        select: {
          id: true, type: true, text: true, options: true, difficulty: true, points: true,
        },
      },
    },
  });
  if (!quiz) return res.status(404).json({ error: "Quiz not found" });
  res.json(quiz);
});

const generateSchema = z.object({
  topic: z.string(),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  count: z.number().min(1).max(20).default(5),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  types: z.array(z.string()).default(["MCQ", "TRUE_FALSE"]),
  timeLimitSec: z.number().optional(),
});

router.post("/generate", async (req, res) => {
  try {
    const data = generateSchema.parse(req.body);
    const generated = await generateQuizQuestions(data.topic, data.count, data.difficulty, data.types);

    const quiz = await prisma.quiz.create({
      data: {
        title: `${data.topic} Quiz`,
        description: `AI-generated quiz on ${data.topic}`,
        subjectId: data.subjectId,
        topicId: data.topicId,
        createdById: req.user!.userId,
        difficulty: data.difficulty as Difficulty,
        timeLimitSec: data.timeLimitSec || data.count * 60,
        questions: {
          create: generated.map((q) => ({
            type: q.type as QuestionType,
            text: q.text,
            options: q.options ? q.options : undefined,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty as Difficulty,
          })),
        },
      },
      include: { questions: true, subject: true, topic: true },
    });
    res.status(201).json(quiz);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    console.error(e);
    res.status(500).json({ error: "Quiz generation failed" });
  }
});

const submitSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    userAnswer: z.string(),
  })),
  timeSpentSec: z.number(),
});

router.post("/:id/submit", async (req, res) => {
  try {
    const data = submitSchema.parse(req.body);
    const quiz = await prisma.quiz.findUnique({
      where: { id: req.params.id },
      include: { questions: true },
    });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    let score = 0;
    const maxScore = quiz.questions.reduce((s, q) => s + q.points, 0);
    const answerRecords: { questionId: string; userAnswer: string; isCorrect: boolean }[] = [];

    for (const ans of data.answers) {
      const q = quiz.questions.find((x) => x.id === ans.questionId);
      if (!q) continue;
      const correct =
        ans.userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() ||
        (q.type === "TRUE_FALSE" && ans.userAnswer.toLowerCase() === q.correctAnswer.toLowerCase());
      if (correct) score += q.points;
      answerRecords.push({ questionId: q.id, userAnswer: ans.userAnswer, isCorrect: correct });
    }

    const accuracy = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const nextDifficulty = adjustDifficulty(accuracy);

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: req.user!.userId,
        quizId: quiz.id,
        score,
        maxScore,
        accuracy,
        timeSpentSec: data.timeSpentSec,
        difficulty: nextDifficulty,
        answers: { create: answerRecords },
      },
      include: {
        answers: { include: { question: { select: { id: true, text: true, explanation: true, correctAnswer: true } } } },
      },
    });

    const xpGain = Math.round(accuracy / 2) + 10;
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { xp: { increment: xpGain }, lastStudyDate: new Date() },
    });

    await prisma.leaderboardEntry.upsert({
      where: { userId: req.user!.userId },
      create: {
        userId: req.user!.userId,
        userName: (await prisma.user.findUnique({ where: { id: req.user!.userId } }))?.name || "Student",
        xp: xpGain,
      },
      update: { xp: { increment: xpGain } },
    });

    res.json({ attempt, xpGain, nextDifficulty, explanations: attempt.answers });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    res.status(500).json({ error: "Submit failed" });
  }
});

export default router;
