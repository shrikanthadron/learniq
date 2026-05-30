import { Router } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, signToken } from "../middleware/auth.js";

const router = Router();

const emailField = z
  .string()
  .trim()
  .min(1)
  .max(254)
  .transform((e) => e.toLowerCase())
  .refine((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e), { message: "Enter a valid email address" });

const registerSchema = z.object({
  email: emailField,
  password: z.string().min(6),
  name: z.string().trim().min(2),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]).optional(),
});

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1),
});

const googleSchema = z.object({
  credential: z.string().min(1),
});

function getGoogleClientId(): string {
  return process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
}

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
    if (e instanceof z.ZodError) {
      const message = e.errors[0]?.message || "Invalid input";
      return res.status(400).json({ error: message });
    }
    console.error("Registration error:", e);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ error: "This account uses Google sign-in" });
    }

    if (!(await bcrypt.compare(data.password, user.passwordHash))) {
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
    if (e instanceof z.ZodError) {
      const message = e.errors[0]?.message || "Invalid input";
      return res.status(400).json({ error: message });
    }
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/google", async (req, res) => {
  try {
    const clientId = getGoogleClientId();
    if (!clientId) {
      return res.status(503).json({ error: "Google sign-in is not configured" });
    }

    const { credential } = googleSchema.parse(req.body);
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();

    if (!payload?.email || !payload.sub) {
      return res.status(401).json({ error: "Invalid Google token" });
    }

    if (!payload.email_verified) {
      return res.status(401).json({ error: "Google email is not verified" });
    }

    const email = payload.email.toLowerCase();
    const googleId = payload.sub;
    const name = payload.name || email.split("@")[0];
    const avatarUrl = payload.picture ?? null;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    const publicUserSelect = {
      id: true,
      email: true,
      name: true,
      role: true,
      xp: true,
      level: true,
      streakDays: true,
      avatarUrl: true,
      goals: true,
    } as const;

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            googleId: existing.googleId ?? googleId,
            avatarUrl: existing.avatarUrl ?? avatarUrl,
          },
          select: publicUserSelect,
        })
      : await prisma.user.create({
          data: { email, googleId, name, avatarUrl, goals: { exam: "General", dailyHours: 2 } },
          select: publicUserSelect,
        });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.json({ user, token });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Missing Google credential" });
    console.error("Google auth error:", e);
    res.status(401).json({ error: "Google sign-in failed" });
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
