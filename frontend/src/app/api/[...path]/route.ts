import type { NextRequest } from "next/server";
import { runExpress } from "@/lib/express-adapter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path: string[] }> };

async function handler(request: NextRequest, context: RouteContext) {
  try {
    const { path = [] } = await context.params;
    return await runExpress(request, path);
  } catch (error) {
    console.error("API handler error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
