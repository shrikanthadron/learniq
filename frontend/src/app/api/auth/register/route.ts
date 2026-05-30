import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken, userSelect } from "@/lib/server-auth";
import { registerSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const data = registerSchema.parse(await request.json());
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      const message = existing.googleId && !existing.passwordHash
        ? "Email already registered — sign in with Google"
        : "Email already registered";
      return Response.json({ error: message }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role || "STUDENT",
        goals: { exam: "General", dailyHours: 2 },
      },
      select: userSelect,
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return Response.json({ user, token }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      const message = e.errors[0]?.message || "Invalid input";
      return Response.json({ error: message }, { status: 400 });
    }
    console.error("Register error:", e);
    return Response.json({ error: "Registration failed" }, { status: 500 });
  }
}
