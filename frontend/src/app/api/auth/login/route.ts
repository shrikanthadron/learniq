import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/server-auth";
import { loginSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const data = loginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!user.passwordHash) {
      return Response.json(
        { error: "This account uses Google sign-in. Continue with Google below." },
        { status: 401 }
      );
    }

    if (!(await bcrypt.compare(data.password, user.passwordHash))) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return Response.json({
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
      return Response.json({ error: message }, { status: 400 });
    }
    console.error("Login error:", e);
    return Response.json({ error: "Login failed" }, { status: 500 });
  }
}
