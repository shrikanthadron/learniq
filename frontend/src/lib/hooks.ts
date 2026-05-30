"use client";

export function getUserExamGoal(goals?: Record<string, unknown> | null): string {
  const exam = goals?.exam;
  if (typeof exam === "string" && exam.trim()) return exam.toUpperCase();
  return "JEE";
}
