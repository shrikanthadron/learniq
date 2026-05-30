"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  formatStudyHours,
  getCurrentReminderHour,
  markReminderSent,
  reminderStorageKey,
  wasReminderSent,
  STUDY_REMINDER_HOURS,
} from "@/lib/study-reminders";
import { playTimerCompleteSound, requestNotificationPermission, showBrowserNotification } from "@/lib/pomodoro-alerts";

function reminderLabel(hour: number): string {
  if (hour === 7) return "Morning check-in";
  if (hour === 15) return "Afternoon check-in";
  return "Evening check-in";
}

export function StudyReminderScheduler() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const goals = (user.goals || {}) as Record<string, unknown>;
    if (goals.reminders === false) return;

    let active = true;

    const tick = async () => {
      if (!active) return;
      const now = new Date();
      const hour = getCurrentReminderHour(now);
      if (hour === null) return;

      const key = reminderStorageKey(now, hour);
      if (wasReminderSent(key)) return;

      try {
        const { minutes } = await api<{ minutes: number; hours: number }>("/analytics/today-study");
        const label = reminderLabel(hour);
        const body = `You've studied ${formatStudyHours(minutes)} today. Keep going!`;

        await requestNotificationPermission();
        playTimerCompleteSound();
        showBrowserNotification(`LearnIQ · ${label}`, body);

        await api("/notifications", {
          method: "POST",
          body: JSON.stringify({
            title: label,
            message: body,
            type: "study-reminder",
          }),
        }).catch(() => {});

        markReminderSent(key);
      } catch {
        /* skip if API unavailable */
      }
    };

    requestNotificationPermission();
    tick();
    const interval = setInterval(tick, 60_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user]);

  return null;
}

export { STUDY_REMINDER_HOURS };
