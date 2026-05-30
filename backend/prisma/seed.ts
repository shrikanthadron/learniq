import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const student = await prisma.user.upsert({
    where: { email: "student@learniq.com" },
    update: {},
    create: {
      email: "student@learniq.com",
      passwordHash,
      name: "Alex Rivera",
      role: "STUDENT",
      xp: 1250,
      level: 5,
      streakDays: 12,
      goals: { exam: "JEE", dailyHours: 3, target: "IIT" },
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@learniq.com" },
    update: {},
    create: {
      email: "teacher@learniq.com",
      passwordHash,
      name: "Dr. Sarah Chen",
      role: "TEACHER",
      xp: 500,
      level: 3,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@learniq.com" },
    update: {},
    create: {
      email: "admin@learniq.com",
      passwordHash,
      name: "Admin User",
      role: "ADMIN",
    },
  });

  const subjects = [
    { name: "Mathematics", slug: "mathematics", color: "#6366f1", examMode: "JEE", icon: "📐" },
    { name: "Physics", slug: "physics", color: "#8b5cf6", examMode: "JEE", icon: "⚛️" },
    { name: "Chemistry", slug: "chemistry", color: "#06b6d4", examMode: "NEET", icon: "🧪" },
    { name: "Biology", slug: "biology", color: "#10b981", examMode: "NEET", icon: "🧬" },
    { name: "Computer Science", slug: "cs", color: "#f59e0b", examMode: "GATE", icon: "💻" },
  ];

  for (const s of subjects) {
    const subject = await prisma.subject.upsert({
      where: { slug: s.slug },
      update: {},
      create: s,
    });

    const chapter = await prisma.chapter.create({
      data: {
        subjectId: subject.id,
        title: `Fundamentals of ${s.name}`,
        orderIndex: 0,
        description: `Core concepts in ${s.name}`,
      },
    });

    const topics = ["Introduction", "Core Concepts", "Advanced Problems", "Exam Practice"];
    for (let i = 0; i < topics.length; i++) {
      await prisma.topic.create({
        data: {
          chapterId: chapter.id,
          title: topics[i],
          orderIndex: i,
        },
      });
    }

    await prisma.userSubject.upsert({
      where: { userId_subjectId: { userId: student.id, subjectId: subject.id } },
      update: {},
      create: {
        userId: student.id,
        subjectId: subject.id,
        progressPercent: 30 + Math.random() * 50,
        weakTopics: [topics[2]],
        dailyStudyHours: 2,
      },
    });
  }

  const math = await prisma.subject.findUnique({ where: { slug: "mathematics" } });
  const mathTopic = math
    ? await prisma.topic.findFirst({ where: { chapter: { subjectId: math.id } } })
    : null;

  const quiz = await prisma.quiz.create({
    data: {
      title: "Calculus Fundamentals",
      description: "Test your calculus basics",
      subjectId: math?.id,
      topicId: mathTopic?.id,
      difficulty: "MEDIUM",
      timeLimitSec: 600,
      questions: {
        create: [
          {
            type: "MCQ",
            text: "What is the derivative of x²?",
            options: ["2x", "x", "x²", "2"],
            correctAnswer: "2x",
            explanation: "Using power rule: d/dx(x^n) = nx^(n-1)",
            difficulty: "EASY",
          },
          {
            type: "TRUE_FALSE",
            text: "The integral of 1/x is ln|x| + C",
            correctAnswer: "true",
            explanation: "Standard integral result",
            difficulty: "MEDIUM",
          },
          {
            type: "FILL_BLANK",
            text: "The limit of (sin x)/x as x approaches 0 is ______",
            correctAnswer: "1",
            explanation: "Classic L'Hôpital or Taylor expansion result",
            difficulty: "MEDIUM",
          },
          {
            type: "MCQ",
            text: "∫ e^x dx equals:",
            options: ["e^x + C", "xe^x + C", "e^(x+1) + C", "ln x + C"],
            correctAnswer: "e^x + C",
            explanation: "Exponential function is its own derivative",
            difficulty: "EASY",
          },
          {
            type: "SHORT_ANSWER",
            text: "State the Fundamental Theorem of Calculus in one sentence.",
            correctAnswer: "derivative",
            explanation: "Links differentiation and integration",
            difficulty: "HARD",
          },
        ],
      },
    },
    include: { questions: true },
  });

  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    await prisma.quizAttempt.create({
      data: {
        userId: student.id,
        quizId: quiz.id,
        score: 3 + Math.floor(Math.random() * 2),
        maxScore: 5,
        accuracy: 60 + Math.random() * 35,
        timeSpentSec: 300 + Math.floor(Math.random() * 200),
        completedAt: d,
      },
    });
  }

  for (let day = 0; day < 5; day++) {
    const start = new Date();
    start.setDate(start.getDate() + day);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start);
    end.setHours(11, 30, 0, 0);
    await prisma.plannerEvent.create({
      data: {
        userId: student.id,
        title: day % 2 === 0 ? "Mathematics Study" : "Physics Revision",
        startAt: start,
        endAt: end,
        priority: 2,
        view: "WEEKLY",
      },
    });
  }

  const achievements = [
    { name: "First Steps", description: "Complete your first quiz", icon: "🎯", xpReward: 50 },
    { name: "Streak Master", description: "7-day study streak", icon: "🔥", xpReward: 100 },
    { name: "Quiz Champion", description: "Score 90%+ on a quiz", icon: "🏆", xpReward: 150 },
    { name: "Night Owl", description: "Study after 10 PM", icon: "🦉", xpReward: 75 },
  ];

  const existingAch = await prisma.achievement.count();
  if (existingAch === 0) {
    for (const a of achievements) {
      const ach = await prisma.achievement.create({ data: a });
      if (a.name === "First Steps") {
        await prisma.userAchievement.create({
          data: { userId: student.id, achievementId: ach.id },
        });
      }
    }
  }

  await prisma.leaderboardEntry.upsert({
    where: { userId: student.id },
    update: { xp: 1250, userName: student.name, rank: 1 },
    create: { userId: student.id, userName: student.name, xp: 1250, rank: 1 },
  });

  await prisma.notification.createMany({
    data: [
      { userId: student.id, title: "Revision Due", message: "Review Calculus weak topics today", type: "reminder" },
      { userId: student.id, title: "Streak Alert", message: "Keep your 12-day streak going!", type: "streak" },
      { userId: student.id, title: "New Quiz", message: "Adaptive quiz ready for Physics", type: "quiz" },
    ],
  });

  await prisma.recommendation.create({
    data: {
      userId: student.id,
      type: "daily",
      title: "Today's Study Plan",
      content: {
        dailyTopics: ["Calculus - Integration", "Physics - Mechanics", "Chemistry - Organic"],
        revisionPlan: "25-min Pomodoro blocks with 5-min breaks. Focus weak topics first.",
        practiceSessions: ["Morning: theory review", "Afternoon: timed quiz", "Evening: flashcards"],
        suggestedDifficulty: "MEDIUM",
        examReadiness: 72,
      },
    },
  });

  console.log("Seed complete:");
  console.log("  student@learniq.com / password123");
  console.log("  teacher@learniq.com / password123");
  console.log("  admin@learniq.com / password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
