import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken, userSelect } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const googleSchema = z.object({
  credential: z.string().min(1),
});

function getGoogleClientId(): string {
  return (
    process.env.GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    ""
  );
}

export async function POST(request: Request) {
  try {
    const clientId = getGoogleClientId();
    if (!clientId) {
      return Response.json(
        { error: "Google sign-in is not configured on the server" },
        { status: 503 }
      );
    }

    const { credential } = googleSchema.parse(await request.json());
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
      return Response.json({ error: "Invalid Google token" }, { status: 401 });
    }

    if (!payload.email_verified) {
      return Response.json({ error: "Google email is not verified" }, { status: 401 });
    }

    const email = payload.email.toLowerCase();
    const googleId = payload.sub;
    const name = payload.name || email.split("@")[0];
    const avatarUrl = payload.picture ?? null;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            googleId: existing.googleId ?? googleId,
            avatarUrl: existing.avatarUrl ?? avatarUrl,
            name: existing.name || name,
          },
          select: userSelect,
        })
      : await prisma.user.create({
          data: {
            email,
            googleId,
            name,
            avatarUrl,
            goals: { exam: "General", dailyHours: 2 },
          },
          select: userSelect,
        });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return Response.json({ user, token }, { status: 200 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return Response.json({ error: "Missing Google credential" }, { status: 400 });
    }
    console.error("Google auth error:", e);
    return Response.json({ error: "Google sign-in failed" }, { status: 401 });
  }
}
