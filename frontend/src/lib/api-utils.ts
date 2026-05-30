import { z } from "zod";
import { verifyToken, AuthPayload, AuthRole } from "./server-auth";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export function getBearerUser(request: Request): AuthPayload | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  try {
    return verifyToken(header.slice(7));
  } catch {
    return null;
  }
}

export function requireUser(request: Request): AuthPayload {
  const user = getBearerUser(request);
  if (!user) throw new ApiError(401, "Authentication required");
  return user;
}

export function requireRole(user: AuthPayload, ...roles: AuthRole[]) {
  if (!roles.includes(user.role)) {
    throw new ApiError(403, "Insufficient permissions");
  }
}

export async function parseJson<T>(request: Request): Promise<T> {
  return request.json() as Promise<T>;
}

export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof z.ZodError) {
    return Response.json({ error: error.errors }, { status: 400 });
  }
  console.error("API error:", error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
