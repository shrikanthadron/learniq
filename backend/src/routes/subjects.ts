import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

/** Subjects recommended per exam goal */
const EXAM_SUBJECT_SLUGS: Record<string, string[]> = {
  JEE: ["physics", "chemistry", "mathematics"],
  NEET: ["physics", "chemistry", "biology"],
  GATE: ["gate-cs", "gate-ec", "gate-ee", "gate-me", "gate-ce", "gate-in"],
  CET: ["mathematics", "physics", "chemistry", "biology"],
};

router.get("/", async (req, res) => {
  const exam = String(req.query.exam || "").toUpperCase();
  const slugs = exam ? EXAM_SUBJECT_SLUGS[exam] : undefined;

  const subjects = await prisma.subject.findMany({
    where: slugs ? { slug: { in: slugs } } : undefined,
    include: {
      chapters: {
        orderBy: { orderIndex: "asc" },
        include: { topics: { orderBy: { orderIndex: "asc" } } },
      },
      _count: { select: { quizzes: true } },
    },
    orderBy: slugs
      ? undefined
      : { name: "asc" },
  });

  const ordered = slugs
    ? slugs.map((slug) => subjects.find((s) => s.slug === slug)).filter(Boolean)
    : subjects;

  res.json(ordered.length ? ordered : subjects);
});

router.get("/my", authenticate, async (req, res) => {
  const userSubjects = await prisma.userSubject.findMany({
    where: { userId: req.user!.userId },
    include: { subject: { include: { chapters: { include: { topics: true } } } } },
  });
  res.json(userSubjects);
});

router.post("/enroll", authenticate, async (req, res) => {
  const { subjectId, targetExamDate, dailyStudyHours } = req.body;
  const enrollment = await prisma.userSubject.upsert({
    where: { userId_subjectId: { userId: req.user!.userId, subjectId } },
    create: {
      userId: req.user!.userId,
      subjectId,
      targetExamDate: targetExamDate ? new Date(targetExamDate) : undefined,
      dailyStudyHours: dailyStudyHours || 2,
    },
    update: {
      targetExamDate: targetExamDate ? new Date(targetExamDate) : undefined,
      dailyStudyHours,
    },
    include: { subject: true },
  });
  res.json(enrollment);
});

export default router;
