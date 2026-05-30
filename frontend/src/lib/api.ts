const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("learniq_token");
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      `Cannot reach the API at ${API_URL}. Start the backend: cd backend → npm run dev`
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const message = err.error;
    throw new Error(
      typeof message === "string"
        ? message
        : Array.isArray(message)
          ? "Invalid input — check your details"
          : "Request failed"
    );
  }
  return res.json();
}

export const authApi = {
  login: (email: string, password: string) =>
    api<{ user: User; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (data: { email: string; password: string; name: string; role?: string }) =>
    api<{ user: User; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  me: () => api<User>("/auth/me"),
};

export interface User {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  xp: number;
  level: number;
  streakDays: number;
  avatarUrl?: string;
  goals?: Record<string, unknown>;
}
