import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { summarizeNotes, generateQuizQuestions } from "../services/ai.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  const notes = await prisma.note.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(notes);
});

router.post("/", async (req, res) => {
  const { title, content, subjectId } = req.body;
  const summary = await summarizeNotes(content || "");
  const note = await prisma.note.create({
    data: {
      userId: req.user!.userId,
      title: title || "Untitled Note",
      content: content || "",
      summary,
      subjectId,
    },
  });
  res.status(201).json(note);
});

router.post("/:id/flashcards", async (req, res) => {
  const note = await prisma.note.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });
  if (!note) return res.status(404).json({ error: "Note not found" });

  const source = [note.title, note.content, note.summary].filter(Boolean).join("\n").slice(0, 2000);
  const questions = await generateQuizQuestions(source || note.title, 5, "MEDIUM", ["MCQ", "SHORT_ANSWER"]);
  const cards = await Promise.all(
    questions.map((q) =>
      prisma.flashcard.create({
        data: {
          userId: req.user!.userId,
          noteId: note.id,
          front: q.text,
          back: q.explanation || q.correctAnswer,
          subjectId: note.subjectId ?? undefined,
        },
      })
    )
  );
  res.status(201).json(cards);
});

router.get("/:id/flashcards", async (req, res) => {
  const note = await prisma.note.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });
  if (!note) return res.status(404).json({ error: "Note not found" });
  const cards = await prisma.flashcard.findMany({
    where: { userId: req.user!.userId, noteId: note.id },
    orderBy: { nextReview: "desc" },
  });
  res.json(cards);
});

router.delete("/:id", async (req, res) => {
  const note = await prisma.note.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });
  if (!note) return res.status(404).json({ error: "Note not found" });
  await prisma.flashcard.deleteMany({ where: { noteId: note.id, userId: req.user!.userId } });
  await prisma.note.delete({ where: { id: note.id } });
  res.json({ success: true });
});

router.get("/flashcards/due", async (req, res) => {
  const cards = await prisma.flashcard.findMany({
    where: { userId: req.user!.userId, nextReview: { lte: new Date() } },
    take: 20,
  });
  res.json(cards);
});

export default router;
