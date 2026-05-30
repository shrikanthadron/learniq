export const STUDY_REMINDER_HOURS = [7, 15, 19] as const;

export function reminderStorageKey(date: Date, hour: number): string {
  const d = date.toISOString().slice(0, 10);
  return `learniq_study_reminder_${d}_${hour}`;
}

export function wasReminderSent(key: string): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(key) === "1";
}

export function markReminderSent(key: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, "1");
}

export function formatStudyHours(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} hr${h === 1 ? "" : "s"}`;
  return `${h} hr${h === 1 ? "" : "s"} ${m} min`;
}

export function getCurrentReminderHour(now: Date): number | null {
  const h = now.getHours();
  const m = now.getMinutes();
  if (m > 0) return null;
  return STUDY_REMINDER_HOURS.includes(h as (typeof STUDY_REMINDER_HOURS)[number]) ? h : null;
}
