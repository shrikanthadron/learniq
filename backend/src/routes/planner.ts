import { Router } from "express";
import { z } from "zod";
import { PlannerView } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/events", async (req, res) => {
  const { from, to, view } = req.query;
  const events = await prisma.plannerEvent.findMany({
    where: {
      userId: req.user!.userId,
      ...(from && { startAt: { gte: new Date(String(from)) } }),
      ...(to && { endAt: { lte: new Date(String(to)) } }),
      ...(view && { view: String(view) as PlannerView }),
    },
    orderBy: [{ startAt: "asc" }, { orderIndex: "asc" }],
  });
  res.json(events);
});

const dateString = z.string().min(1).transform((s) => new Date(s));

const eventSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  subjectId: z.string().optional(),
  startAt: dateString,
  endAt: dateString,
  priority: z.number().optional(),
  reminderAt: z.string().optional().transform((s) => (s ? new Date(s) : undefined)),
  view: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
  orderIndex: z.number().optional(),
});

router.post("/events", async (req, res) => {
  try {
    const data = eventSchema.parse(req.body);
    const event = await prisma.plannerEvent.create({
      data: {
        userId: req.user!.userId,
        title: data.title,
        description: data.description,
        subjectId: data.subjectId,
        startAt: data.startAt,
        endAt: data.endAt,
        priority: data.priority ?? 1,
        reminderAt: data.reminderAt,
        view: (data.view as PlannerView) || "DAILY",
        orderIndex: data.orderIndex ?? 0,
      },
    });
    res.status(201).json(event);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    res.status(500).json({ error: "Failed to create event" });
  }
});

router.patch("/events/:id", async (req, res) => {
  const existing = await prisma.plannerEvent.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });
  if (!existing) return res.status(404).json({ error: "Event not found" });

  const { title, description, startAt, endAt, priority, completed, orderIndex, reminderAt } = req.body;
  const event = await prisma.plannerEvent.update({
    where: { id: req.params.id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(startAt && { startAt: new Date(startAt) }),
      ...(endAt && { endAt: new Date(endAt) }),
      ...(priority !== undefined && { priority }),
      ...(completed !== undefined && { completed }),
      ...(orderIndex !== undefined && { orderIndex }),
      ...(reminderAt && { reminderAt: new Date(reminderAt) }),
    },
  });
  res.json(event);
});

router.delete("/events/:id", async (req, res) => {
  const existing = await prisma.plannerEvent.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });
  if (!existing) return res.status(404).json({ error: "Event not found" });
  await prisma.plannerEvent.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

router.post("/generate-timetable", async (req, res) => {
  const { examDate, hoursPerDay, priorities } = req.body as {
    examDate?: string;
    hoursPerDay?: number;
    priorities?: string[];
  };

  const subjects = await prisma.subject.findMany({ take: 5 });
  const now = new Date();
  const events = [];

  for (let day = 0; day < 7; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() + day);
    const topics = priorities?.length ? priorities : subjects.map((s) => s.name);

    for (let block = 0; block < (hoursPerDay || 2); block++) {
      const start = new Date(date);
      start.setHours(9 + block * 2, 0, 0, 0);
      const end = new Date(start);
      end.setHours(start.getHours() + 1, 45, 0, 0);

      events.push({
        userId: req.user!.userId,
        title: `Study: ${topics[block % topics.length]}`,
        description: "AI-scheduled session",
        startAt: start,
        endAt: end,
        priority: block === 0 ? 3 : 2,
        view: "WEEKLY" as PlannerView,
        orderIndex: block,
      });
    }
  }

  await prisma.plannerEvent.deleteMany({
    where: { userId: req.user!.userId, description: "AI-scheduled session" },
  });

  const created = await prisma.plannerEvent.createMany({ data: events });
  res.json({ created: created.count, events: await prisma.plannerEvent.findMany({ where: { userId: req.user!.userId } }) });
});

router.post("/pomodoro", async (req, res) => {
  const { durationMin, subjectId, topic } = req.body;
  const session = await prisma.studySession.create({
    data: {
      userId: req.user!.userId,
      durationMin: durationMin || 25,
      subjectId,
      topic,
      pomodoro: true,
      type: "pomodoro",
    },
  });

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  const today = new Date().toDateString();
  const last = user?.lastStudyDate?.toDateString();
  let streakDays = user?.streakDays || 0;
  if (last !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    streakDays = last === yesterday.toDateString() ? streakDays + 1 : 1;
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { streakDays, lastStudyDate: new Date(), xp: { increment: 5 } },
    });
  }

  res.status(201).json(session);
});

export default router;
