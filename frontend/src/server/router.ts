import { z } from "zod";
import { Difficulty, PlannerView, QuestionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseJson, requireRole, requireUser } from "@/lib/api-utils";
import { generateQuizQuestions, summarizeNotes } from "@/server/services/ai";
import { adjustDifficulty, buildAdaptiveRecommendations } from "@/server/services/recommendations";
import { checkAndAwardAchievements } from "@/server/services/achievements";
import { EXAM_SUBJECT_SLUGS } from "@/lib/exam-config";

export async function handleApi(request: Request, pathSegments: string[]): Promise<Response> {
  const path = pathSegments.join("/");
  const method = request.method;
  const url = new URL(request.url);
  const q = url.searchParams;

  // --- Subjects ---
  if (method === "GET" && path === "subjects") {
    const exam = String(q.get("exam") || "").toUpperCase();
    const branch = q.get("branch");
    let slugs = exam ? EXAM_SUBJECT_SLUGS[exam] : undefined;
    if (exam === "GATE" && branch) {
      slugs = [branch];
    }
    const subjects = await prisma.subject.findMany({
      where: slugs ? { slug: { in: slugs } } : undefined,
      include: {
        chapters: {
          orderBy: { orderIndex: "asc" },
          include: { topics: { orderBy: { orderIndex: "asc" } } },
        },
        _count: { select: { quizzes: true } },
      },
      orderBy: slugs ? undefined : { name: "asc" },
    });
    const ordered = slugs
      ? slugs.map((slug) => subjects.find((s) => s.slug === slug)).filter(Boolean)
      : subjects;
    return Response.json(ordered.length ? ordered : subjects);
  }

  if (method === "GET" && path === "subjects/syllabus-progress") {
    const user = requireUser(request);
    const subjectId = q.get("subjectId");
    const records = await prisma.progressRecord.findMany({
      where: { userId: user.userId, entityType: "topic" },
    });
    const map: Record<string, { percent: number; completed: boolean }> = {};
    for (const r of records) {
      if (!subjectId || r.entityId) map[r.entityId] = { percent: r.percent, completed: r.completed };
    }
    return Response.json(map);
  }

  if (method === "POST" && path === "subjects/topic-progress") {
    const user = requireUser(request);
    const { topicId, subjectId, percent, completed } = await parseJson<{
      topicId: string;
      subjectId: string;
      percent: number;
      completed?: boolean;
    }>(request);
    const record = await prisma.progressRecord.upsert({
      where: { userId_entityType_entityId: { userId: user.userId, entityType: "topic", entityId: topicId } },
      create: { userId: user.userId, entityType: "topic", entityId: topicId, percent, completed: completed ?? false },
      update: { percent, completed: completed ?? false },
    });
    if (subjectId) {
      const topics = await prisma.topic.findMany({ where: { chapter: { subjectId } } });
      const allProgress = await prisma.progressRecord.findMany({
        where: { userId: user.userId, entityType: "topic", entityId: { in: topics.map((t) => t.id) } },
      });
      const avg = topics.length ? allProgress.reduce((s, p) => s + p.percent, 0) / topics.length : percent;
      await prisma.userSubject.upsert({
        where: { userId_subjectId: { userId: user.userId, subjectId } },
        create: { userId: user.userId, subjectId, progressPercent: avg },
        update: { progressPercent: avg },
      });
    }
    await checkAndAwardAchievements(user.userId);
    return Response.json(record);
  }

  if (method === "GET" && path === "subjects/my") {
    const user = requireUser(request);
    const userSubjects = await prisma.userSubject.findMany({
      where: { userId: user.userId },
      include: { subject: { include: { chapters: { include: { topics: true } } } } },
    });
    return Response.json(userSubjects);
  }

  if (method === "GET" && path === "subjects/dashboard") {
    const user = requireUser(request);
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { goals: true },
    });
    const goals = (dbUser?.goals || {}) as Record<string, unknown>;
    const exam = String(goals.exam || "JEE").toUpperCase();
    const branch = typeof goals.gateBranch === "string" ? goals.gateBranch : null;
    let slugs = EXAM_SUBJECT_SLUGS[exam];
    if (exam === "GATE" && branch) slugs = [branch];

    const [subjects, userSubjects, recentAttempts, recentSessions] = await Promise.all([
      prisma.subject.findMany({
        where: slugs ? { slug: { in: slugs } } : undefined,
        orderBy: { name: "asc" },
      }),
      prisma.userSubject.findMany({
        where: { userId: user.userId },
        include: { subject: true },
      }),
      prisma.quizAttempt.findMany({
        where: { userId: user.userId },
        orderBy: { completedAt: "desc" },
        take: 20,
        include: { quiz: { select: { subjectId: true, subject: true } } },
      }),
      prisma.studySession.findMany({
        where: { userId: user.userId },
        orderBy: { startedAt: "desc" },
        take: 20,
        select: { subjectId: true, startedAt: true },
      }),
    ]);

    const orderedSubjects = slugs
      ? slugs.map((slug) => subjects.find((s) => s.slug === slug)).filter(Boolean)
      : subjects;

    const activityScore = new Map<string, number>();
    recentAttempts.forEach((a, i) => {
      const sid = a.quiz.subjectId;
      if (sid) activityScore.set(sid, (activityScore.get(sid) || 0) + (20 - i));
    });
    recentSessions.forEach((s, i) => {
      if (s.subjectId) activityScore.set(s.subjectId, (activityScore.get(s.subjectId) || 0) + (10 - i));
    });

    const lastActiveId =
      typeof goals.lastActiveSubjectId === "string" ? goals.lastActiveSubjectId : null;
    if (lastActiveId) activityScore.set(lastActiveId, (activityScore.get(lastActiveId) || 0) + 50);

    const progressMap = new Map(userSubjects.map((us) => [us.subjectId, us.progressPercent]));

    const result = orderedSubjects
      .filter(Boolean)
      .map((subject) => ({
        subjectId: subject!.id,
        progressPercent: progressMap.get(subject!.id) ?? 0,
        activityScore: activityScore.get(subject!.id) ?? 0,
        subject: {
          id: subject!.id,
          name: subject!.name,
          slug: subject!.slug,
          color: subject!.color,
          icon: subject!.icon,
        },
      }));

    result.sort((a, b) => {
      if (b.activityScore !== a.activityScore) return b.activityScore - a.activityScore;
      return b.progressPercent - a.progressPercent;
    });

    const activeId =
      lastActiveId ||
      (result.length && result[0].activityScore > 0 ? result[0].subjectId : null);

    return Response.json({
      exam,
      subjects: result.map((r) => ({ ...r, isActive: r.subjectId === activeId })),
      lastActiveSubjectId: activeId,
    });
  }

  if (method === "POST" && path === "subjects/enroll") {
    const user = requireUser(request);
    const { subjectId, targetExamDate, dailyStudyHours } = await parseJson<{
      subjectId: string;
      targetExamDate?: string;
      dailyStudyHours?: number;
    }>(request);
    const enrollment = await prisma.userSubject.upsert({
      where: { userId_subjectId: { userId: user.userId, subjectId } },
      create: {
        userId: user.userId,
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
    return Response.json(enrollment);
  }

  // --- Quizzes ---
  if (method === "GET" && path === "quizzes") {
    requireUser(request);
    const subjectId = q.get("subjectId");
    const topicId = q.get("topicId");
    const difficulty = q.get("difficulty");
    const quizzes = await prisma.quiz.findMany({
      where: {
        isPublished: true,
        ...(subjectId && { subjectId }),
        ...(topicId && { topicId }),
        ...(difficulty && { difficulty: difficulty as Difficulty }),
      },
      include: {
        subject: true,
        topic: true,
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(quizzes);
  }

  const quizGetMatch = path.match(/^quizzes\/([^/]+)$/);
  if (method === "GET" && quizGetMatch) {
    requireUser(request);
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizGetMatch[1] },
      include: {
        subject: true,
        topic: true,
        questions: {
          select: { id: true, type: true, text: true, options: true, difficulty: true, points: true },
        },
      },
    });
    if (!quiz) return Response.json({ error: "Quiz not found" }, { status: 404 });
    return Response.json(quiz);
  }

  if (method === "POST" && path === "quizzes/generate") {
    const user = requireUser(request);
    const generateSchema = z.object({
      topic: z.string(),
      subjectId: z.string().optional(),
      topicId: z.string().optional(),
      count: z.number().min(1).max(20).default(15),
      difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
      types: z.array(z.string()).default(["MCQ", "TRUE_FALSE"]),
      timeLimitSec: z.number().optional(),
    });
    const data = generateSchema.parse(await request.json());
    const generated = await generateQuizQuestions(data.topic, data.count, data.difficulty, data.types);
    const quiz = await prisma.quiz.create({
      data: {
        title: `${data.topic} Quiz`,
        description: `AI-generated quiz on ${data.topic}`,
        subjectId: data.subjectId,
        topicId: data.topicId,
        createdById: user.userId,
        difficulty: data.difficulty as Difficulty,
        timeLimitSec: data.timeLimitSec || data.count * 90,
        questions: {
          create: generated.map((item) => ({
            type: item.type as QuestionType,
            text: item.text,
            options: item.options ? item.options : undefined,
            correctAnswer: item.correctAnswer,
            explanation: item.explanation,
            difficulty: item.difficulty as Difficulty,
          })),
        },
      },
      include: { questions: true, subject: true, topic: true },
    });
    return Response.json(quiz, { status: 201 });
  }

  const quizSubmitMatch = path.match(/^quizzes\/([^/]+)\/submit$/);
  if (method === "POST" && quizSubmitMatch) {
    const user = requireUser(request);
    const submitSchema = z.object({
      answers: z.array(z.object({ questionId: z.string(), userAnswer: z.string() })),
      timeSpentSec: z.number(),
    });
    const data = submitSchema.parse(await request.json());
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizSubmitMatch[1] },
      include: { questions: true },
    });
    if (!quiz) return Response.json({ error: "Quiz not found" }, { status: 404 });

    let score = 0;
    const maxScore = quiz.questions.reduce((s, item) => s + item.points, 0);
    const answerRecords: { questionId: string; userAnswer: string; isCorrect: boolean }[] = [];

    for (const ans of data.answers) {
      const question = quiz.questions.find((x) => x.id === ans.questionId);
      if (!question) continue;
      const correct =
        ans.userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase() ||
        (question.type === "TRUE_FALSE" &&
          ans.userAnswer.toLowerCase() === question.correctAnswer.toLowerCase());
      if (correct) score += question.points;
      answerRecords.push({ questionId: question.id, userAnswer: ans.userAnswer, isCorrect: correct });
    }

    const accuracy = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const nextDifficulty = adjustDifficulty(accuracy);
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: user.userId,
        quizId: quiz.id,
        score,
        maxScore,
        accuracy,
        timeSpentSec: data.timeSpentSec,
        difficulty: nextDifficulty,
        answers: { create: answerRecords },
      },
      include: {
        answers: {
          include: {
            question: { select: { id: true, text: true, explanation: true, correctAnswer: true } },
          },
        },
      },
    });

    const xpGain = Math.round(accuracy / 2) + 10;
    await prisma.user.update({
      where: { id: user.userId },
      data: { xp: { increment: xpGain }, lastStudyDate: new Date() },
    });

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    await prisma.leaderboardEntry.upsert({
      where: { userId: user.userId },
      create: { userId: user.userId, userName: dbUser?.name || "Student", xp: xpGain },
      update: { xp: { increment: xpGain } },
    });

    const newAchievements = await checkAndAwardAchievements(user.userId);

    if (quiz.subjectId) {
      const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { goals: true } });
      const goals = (dbUser?.goals || {}) as Record<string, unknown>;
      await prisma.user.update({
        where: { id: user.userId },
        data: { goals: { ...goals, lastActiveSubjectId: quiz.subjectId } },
      });
    }

    return Response.json({ attempt, xpGain, nextDifficulty, explanations: attempt.answers, newAchievements });
  }

  const quizDeleteMatch = path.match(/^quizzes\/([^/]+)$/);
  if (method === "DELETE" && quizDeleteMatch) {
    const user = requireUser(request);
    const quiz = await prisma.quiz.findUnique({ where: { id: quizDeleteMatch[1] } });
    if (!quiz) return Response.json({ error: "Quiz not found" }, { status: 404 });
    if (quiz.createdById && quiz.createdById !== user.userId) {
      return Response.json({ error: "You can only delete quizzes you generated" }, { status: 403 });
    }
    if (!quiz.createdById) {
      return Response.json({ error: "Built-in quizzes cannot be deleted" }, { status: 403 });
    }
    await prisma.quiz.delete({ where: { id: quiz.id } });
    return Response.json({ success: true });
  }

  // --- Planner ---
  if (method === "GET" && path === "planner/events") {
    const user = requireUser(request);
    const from = q.get("from");
    const to = q.get("to");
    const view = q.get("view");
    const events = await prisma.plannerEvent.findMany({
      where: {
        userId: user.userId,
        ...(from && to
          ? { startAt: { lte: new Date(to) }, endAt: { gte: new Date(from) } }
          : from
            ? { startAt: { gte: new Date(from) } }
            : to
              ? { endAt: { lte: new Date(to) } }
              : {}),
        ...(view && { view: view as PlannerView }),
      },
      orderBy: [{ startAt: "asc" }, { orderIndex: "asc" }],
    });
    return Response.json(events);
  }

  if (method === "POST" && path === "planner/events") {
    const user = requireUser(request);
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
    const data = eventSchema.parse(await request.json());
    const event = await prisma.plannerEvent.create({
      data: {
        userId: user.userId,
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
    return Response.json(event, { status: 201 });
  }

  const plannerEventMatch = path.match(/^planner\/events\/([^/]+)$/);
  if (method === "PATCH" && plannerEventMatch) {
    const user = requireUser(request);
    const existing = await prisma.plannerEvent.findFirst({
      where: { id: plannerEventMatch[1], userId: user.userId },
    });
    if (!existing) return Response.json({ error: "Event not found" }, { status: 404 });
    const body = await parseJson<{
      title?: string;
      description?: string;
      startAt?: string;
      endAt?: string;
      priority?: number;
      completed?: boolean;
      orderIndex?: number;
      reminderAt?: string;
    }>(request);
    const { title, description, startAt, endAt, priority, completed, orderIndex, reminderAt } = body;
    const event = await prisma.plannerEvent.update({
      where: { id: plannerEventMatch[1] },
      data: {
        ...(title ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(startAt ? { startAt: new Date(startAt) } : {}),
        ...(endAt ? { endAt: new Date(endAt) } : {}),
        ...(priority !== undefined ? { priority } : {}),
        ...(completed !== undefined ? { completed } : {}),
        ...(orderIndex !== undefined ? { orderIndex } : {}),
        ...(reminderAt ? { reminderAt: new Date(reminderAt) } : {}),
      },
    });
    return Response.json(event);
  }

  if (method === "DELETE" && plannerEventMatch) {
    const user = requireUser(request);
    const existing = await prisma.plannerEvent.findFirst({
      where: { id: plannerEventMatch[1], userId: user.userId },
    });
    if (!existing) return Response.json({ error: "Event not found" }, { status: 404 });
    await prisma.plannerEvent.delete({ where: { id: plannerEventMatch[1] } });
    return Response.json({ success: true });
  }

  if (method === "POST" && path === "planner/generate-timetable") {
    const user = requireUser(request);
    const { hoursPerDay, priorities } = await parseJson<{
      examDate?: string;
      hoursPerDay?: number;
      priorities?: string[];
    }>(request);
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
          userId: user.userId,
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
      where: { userId: user.userId, description: "AI-scheduled session" },
    });
    const created = await prisma.plannerEvent.createMany({ data: events });
    const allEvents = await prisma.plannerEvent.findMany({ where: { userId: user.userId } });
    return Response.json({ created: created.count, events: allEvents });
  }

  if (method === "POST" && path === "planner/pomodoro") {
    const user = requireUser(request);
    const { durationMin, subjectId, topic } = await parseJson<{
      durationMin?: number;
      subjectId?: string;
      topic?: string;
    }>(request);
    const session = await prisma.studySession.create({
      data: {
        userId: user.userId,
        durationMin: durationMin || 25,
        subjectId,
        topic,
        pomodoro: true,
        type: "pomodoro",
      },
    });

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    const today = new Date().toDateString();
    const last = dbUser?.lastStudyDate?.toDateString();
    let streakDays = dbUser?.streakDays || 0;
    if (last !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      streakDays = last === yesterday.toDateString() ? streakDays + 1 : 1;
      await prisma.user.update({
        where: { id: user.userId },
        data: { streakDays, lastStudyDate: new Date(), xp: { increment: 5 } },
      });
    }
    const newAchievements = await checkAndAwardAchievements(user.userId);
    return Response.json({ ...session, newAchievements }, { status: 201 });
  }

  // --- Analytics ---
  if (method === "GET" && path === "analytics/dashboard") {
    const user = requireUser(request);
    const userId = user.userId;
    const [attempts, sessions, progress, dbUser, leaderboard] = await Promise.all([
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
    const examReadiness = Math.min(99, Math.round(avgAccuracy * 0.85 + (dbUser?.streakDays || 0) * 2));
    const consistencyScore = Math.min(100, (dbUser?.streakDays || 0) * 10 + attempts.length * 2);
    const completionPercent =
      progress.length > 0 ? progress.reduce((s, p) => s + p.percent, 0) / progress.length : 45;

    return Response.json({
      accuracyTrend,
      topicStrengths,
      studyTime,
      quizHistory: attempts.slice(-10).reverse(),
      examReadiness,
      consistencyScore,
      completionPercent,
      streakDays: dbUser?.streakDays || 0,
      xp: dbUser?.xp || 0,
      level: dbUser?.level || 1,
      leaderboard,
      predictedScore: examReadiness,
    });
  }

  if (method === "GET" && path === "analytics/recommendations") {
    const user = requireUser(request);
    const result = await buildAdaptiveRecommendations(user.userId);
    return Response.json(result);
  }

  if (method === "GET" && path === "analytics/achievements") {
    const user = requireUser(request);
    const earned = await prisma.userAchievement.findMany({
      where: { userId: user.userId },
      include: { achievement: true },
    });
    const all = await prisma.achievement.findMany();
    return Response.json({ earned, all });
  }

  if (method === "GET" && path === "analytics/today-study") {
    const user = requireUser(request);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const sessions = await prisma.studySession.findMany({
      where: { userId: user.userId, startedAt: { gte: start } },
      select: { durationMin: true },
    });
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: user.userId, completedAt: { gte: start } },
      select: { timeSpentSec: true },
    });
    const sessionMin = sessions.reduce((s, x) => s + x.durationMin, 0);
    const quizMin = Math.round(attempts.reduce((s, x) => s + x.timeSpentSec, 0) / 60);
    const minutes = sessionMin + quizMin;
    return Response.json({ minutes, hours: Math.round((minutes / 60) * 10) / 10 });
  }

  // --- Notes ---
  if (method === "GET" && path === "notes") {
    const user = requireUser(request);
    const notes = await prisma.note.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(notes);
  }

  if (method === "POST" && path === "notes") {
    const user = requireUser(request);
    const { title, content, subjectId } = await parseJson<{
      title?: string;
      content?: string;
      subjectId?: string;
    }>(request);
    const summary = await summarizeNotes(content || "");
    const note = await prisma.note.create({
      data: {
        userId: user.userId,
        title: title || "Untitled Note",
        content: content || "",
        summary,
        subjectId,
      },
    });
    return Response.json(note, { status: 201 });
  }

  const noteIdMatch = path.match(/^notes\/([^/]+)$/);
  if (method === "DELETE" && noteIdMatch) {
    const user = requireUser(request);
    const note = await prisma.note.findFirst({
      where: { id: noteIdMatch[1], userId: user.userId },
    });
    if (!note) return Response.json({ error: "Note not found" }, { status: 404 });
    await prisma.flashcard.deleteMany({ where: { noteId: note.id, userId: user.userId } });
    await prisma.note.delete({ where: { id: note.id } });
    return Response.json({ success: true });
  }

  const noteFlashcardsGetMatch = path.match(/^notes\/([^/]+)\/flashcards$/);
  if (method === "GET" && noteFlashcardsGetMatch) {
    const user = requireUser(request);
    const note = await prisma.note.findFirst({
      where: { id: noteFlashcardsGetMatch[1], userId: user.userId },
    });
    if (!note) return Response.json({ error: "Note not found" }, { status: 404 });
    const cards = await prisma.flashcard.findMany({
      where: { userId: user.userId, noteId: note.id },
      orderBy: { nextReview: "desc" },
    });
    return Response.json(cards);
  }

  if (method === "GET" && path === "flashcards") {
    const user = requireUser(request);
    const cards = await prisma.flashcard.findMany({
      where: { userId: user.userId },
      orderBy: { nextReview: "desc" },
    });
    return Response.json(cards);
  }

  const flashcardDeleteMatch = path.match(/^flashcards\/([^/]+)$/);
  if (method === "DELETE" && flashcardDeleteMatch) {
    const user = requireUser(request);
    const card = await prisma.flashcard.findFirst({
      where: { id: flashcardDeleteMatch[1], userId: user.userId },
    });
    if (!card) return Response.json({ error: "Flashcard not found" }, { status: 404 });
    await prisma.flashcard.delete({ where: { id: card.id } });
    return Response.json({ success: true });
  }

  const noteFlashcardsMatch = path.match(/^notes\/([^/]+)\/flashcards$/);
  if (method === "POST" && noteFlashcardsMatch) {
    const user = requireUser(request);
    const note = await prisma.note.findFirst({
      where: { id: noteFlashcardsMatch[1], userId: user.userId },
    });
    if (!note) return Response.json({ error: "Note not found" }, { status: 404 });
    const source = [note.title, note.content, note.summary].filter(Boolean).join("\n").slice(0, 2000);
    const questions = await generateQuizQuestions(source || note.title, 5, "MEDIUM", ["MCQ", "SHORT_ANSWER"]);
    const cards = await Promise.all(
      questions.map((item) =>
        prisma.flashcard.create({
          data: {
            userId: user.userId,
            noteId: note.id,
            front: item.text,
            back: item.explanation || item.correctAnswer,
            subjectId: note.subjectId ?? undefined,
          },
        })
      )
    );
    return Response.json(cards, { status: 201 });
  }

  // --- Admin ---
  if (method === "GET" && path === "admin/stats") {
    const user = requireUser(request);
    requireRole(user, "TEACHER", "ADMIN");
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
    const usersByRole = await prisma.user.groupBy({ by: ["role"], _count: true });
    return Response.json({
      users,
      students,
      quizzes,
      attempts,
      subjects,
      usersByRole,
      recentAttempts,
      avgEngagement: attempts > 0 ? Math.round(attempts / Math.max(students, 1)) : 0,
    });
  }

  // --- Notifications ---
  if (method === "GET" && path === "notifications") {
    const user = requireUser(request);
    const notifications = await prisma.notification.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return Response.json(notifications);
  }

  const notificationReadMatch = path.match(/^notifications\/([^/]+)\/read$/);
  if (method === "PATCH" && notificationReadMatch) {
    const user = requireUser(request);
    await prisma.notification.updateMany({
      where: { id: notificationReadMatch[1], userId: user.userId },
      data: { read: true },
    });
    return Response.json({ success: true });
  }

  if (method === "POST" && path === "notifications") {
    const user = requireUser(request);
    const { title, message, type } = await parseJson<{
      title: string;
      message: string;
      type?: string;
    }>(request);
    const notification = await prisma.notification.create({
      data: {
        userId: user.userId,
        title: title || "LearnIQ",
        message: message || "",
        type: type || "info",
      },
    });
    return Response.json(notification, { status: 201 });
  }

  return Response.json({ error: "Route not found" }, { status: 404 });
}
