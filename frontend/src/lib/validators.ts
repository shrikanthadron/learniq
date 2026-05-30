import { z } from "zod";

/** RFC 5322–style pattern (practical subset for UX + server checks) */
const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized || normalized.length > 254) return false;
  return EMAIL_PATTERN.test(normalized);
}

export function getEmailError(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "Email is required";
  if (!isValidEmail(trimmed)) {
    return "Enter a valid email address (e.g. name@example.com)";
  }
  return null;
}

export const emailFieldSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(254)
  .transform(normalizeEmail)
  .refine(isValidEmail, { message: "Enter a valid email address" });

export const registerSchema = z.object({
  email: emailFieldSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]).optional(),
});

export const loginSchema = z.object({
  email: emailFieldSchema,
  password: z.string().min(1, "Password is required"),
});
