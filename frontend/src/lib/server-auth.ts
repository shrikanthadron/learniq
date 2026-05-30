import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export type AuthRole = "STUDENT" | "TEACHER" | "ADMIN";

export interface AuthPayload {
  userId: string;
  email: string;
  role: AuthRole;
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}

export const userSelect = {
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
