import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, signToken } from "../middleware/auth.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/register", async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role || "STUDENT",
        goals: { exam: "General", dailyHours: 2 },
      },
      select: { id: true, email: true, name: true, role: true, xp: true, level: true, streakDays: true, avatarUrl: true, goals: true },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.status(201).json({ user, token });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        xp: user.xp,
        level: user.level,
        streakDays: user.streakDays,
        avatarUrl: user.avatarUrl,
        goals: user.goals,
      },
      token,
    });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true, email: true, name: true, role: true, xp: true, level: true,
      streakDays: true, avatarUrl: true, goals: true, locale: true, lastStudyDate: true,
    },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

router.patch("/profile", authenticate, async (req, res) => {
  const { name, avatarUrl, goals, locale } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: {
      ...(name && { name }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(goals && { goals }),
      ...(locale && { locale }),
    },
    select: { id: true, email: true, name: true, role: true, xp: true, level: true, streakDays: true, avatarUrl: true, goals: true, locale: true },
  });
  res.json(user);
});

export default router;
