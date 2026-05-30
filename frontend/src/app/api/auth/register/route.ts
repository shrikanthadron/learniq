import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken, userSelect } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]).optional(),
});

export async function POST(request: Request) {
  try {
    const data = registerSchema.parse(await request.json());
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return Response.json({ error: "Email already registered" }, { status: 409 });
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
      return Response.json({ error: e.errors }, { status: 400 });
    }
    console.error("Register error:", e);
    return Response.json({ error: "Registration failed" }, { status: 500 });
  }
}
