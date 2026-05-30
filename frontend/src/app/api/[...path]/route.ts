import type { NextRequest } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { handleApi } from "@/server/router";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path: string[] }> };

async function handler(request: NextRequest, context: RouteContext) {
  try {
    const { path = [] } = await context.params;
    return await handleApi(request, path);
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
