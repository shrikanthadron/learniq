import { prisma } from "@/lib/prisma";
import { requireUser, handleApiError } from "@/lib/api-utils";
import { userSelect } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const user = requireUser(request);
    const { name, avatarUrl, goals, locale } = await request.json();
    const updated = await prisma.user.update({
      where: { id: user.userId },
      data: {
        ...(name && { name }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(goals && { goals }),
        ...(locale && { locale }),
      },
      select: userSelect,
    });
    return Response.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
