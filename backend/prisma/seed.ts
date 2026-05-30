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
    { name: "Chemistry", slug: "chemistry", color: "#06b6d4", examMode: "JEE", icon: "🧪" },
    { name: "Biology", slug: "biology", color: "#10b981", examMode: "NEET", icon: "🧬" },
  ];

  const gateBranches = [
    { name: "Computer Science", slug: "gate-cs", color: "#f59e0b", icon: "💻", syllabus: ["Engineering Mathematics", "Digital Logic", "Computer Organization", "Programming & Data Structures", "Algorithms", "Theory of Computation", "Compiler Design", "Operating Systems", "Databases", "Computer Networks"] },
    { name: "Electronics & Communication", slug: "gate-ec", color: "#ec4899", icon: "📡", syllabus: ["Engineering Mathematics", "Networks & Signals", "Electronic Devices", "Analog Circuits", "Digital Circuits", "Control Systems", "Communications", "Electromagnetics"] },
    { name: "Electrical Engineering", slug: "gate-ee", color: "#eab308", icon: "⚡", syllabus: ["Engineering Mathematics", "Electric Circuits", "Electromagnetic Fields", "Signals & Systems", "Electrical Machines", "Power Systems", "Control Systems", "Power Electronics"] },
    { name: "Mechanical Engineering", slug: "gate-me", color: "#64748b", icon: "🔧", syllabus: ["Engineering Mathematics", "Engineering Mechanics", "Mechanics of Materials", "Theory of Machines", "Vibrations", "Fluid Mechanics", "Thermodynamics", "Heat Transfer", "Manufacturing"] },
    { name: "Civil Engineering", slug: "gate-ce", color: "#78716c", icon: "🏗️", syllabus: ["Engineering Mathematics", "Structural Analysis", "Concrete Structures", "Steel Structures", "Geotechnical Engineering", "Fluid Mechanics", "Hydraulics", "Environmental Engineering", "Transportation"] },
    { name: "Instrumentation Engineering", slug: "gate-in", color: "#14b8a6", icon: "📊", syllabus: ["Engineering Mathematics", "Electrical Circuits", "Signals & Systems", "Control Systems", "Sensors & Transducers", "Industrial Instrumentation", "Communication & Optical", "Biomedical Instrumentation"] },
  ];

  for (const s of subjects) {
    const subject = await prisma.subject.upsert({
      where: { slug: s.slug },
      update: { name: s.name, examMode: s.examMode, color: s.color, icon: s.icon },
      create: s,
    });

    const existingChapter = await prisma.chapter.findFirst({ where: { subjectId: subject.id } });
    if (!existingChapter) {
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
          data: { chapterId: chapter.id, title: topics[i], orderIndex: i },
        });
      }
    }

    await prisma.userSubject.upsert({
      where: { userId_subjectId: { userId: student.id, subjectId: subject.id } },
      update: {},
      create: {
        userId: student.id,
        subjectId: subject.id,
        progressPercent: 30 + Math.random() * 50,
        weakTopics: ["Advanced Problems"],
        dailyStudyHours: 2,
      },
    });
  }

  for (const branch of gateBranches) {
    const subject = await prisma.subject.upsert({
      where: { slug: branch.slug },
      update: { name: branch.name, examMode: "GATE", color: branch.color, icon: branch.icon },
      create: { name: branch.name, slug: branch.slug, color: branch.color, examMode: "GATE", icon: branch.icon },
    });

    const existingChapter = await prisma.chapter.findFirst({ where: { subjectId: subject.id, title: "GATE Syllabus" } });
    if (!existingChapter) {
      const chapter = await prisma.chapter.create({
        data: { subjectId: subject.id, title: "GATE Syllabus", orderIndex: 0, description: `${branch.name} syllabus tracker` },
      });
      for (let i = 0; i < branch.syllabus.length; i++) {
        await prisma.topic.create({
          data: { chapterId: chapter.id, title: branch.syllabus[i], orderIndex: i },
        });
      }
    }
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
    { name: "Subject Master", description: "Complete 100% of a subject", icon: "📚", xpReward: 200 },
    { name: "Focus Hero", description: "Complete 10 Pomodoro sessions", icon: "⏱️", xpReward: 80 },
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
