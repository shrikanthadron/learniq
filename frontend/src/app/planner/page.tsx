"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Plus, Timer, Sparkles, Pencil, Trash2, Bell, Volume2 } from "lucide-react";
import { api } from "@/lib/api";
import { getRangeForView, PlannerViewMode } from "@/lib/planner-utils";
import { requestNotificationPermission, playTimerCompleteSound, showBrowserNotification } from "@/lib/pomodoro-alerts";
import { DashboardLayout } from "@/components/ui/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EventModal, PlannerEventForm } from "@/components/planner/EventModal";
import { PlannerCalendar } from "@/components/planner/PlannerCalendar";

interface PlannerEvent {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  completed: boolean;
  priority: number;
}

export default function PlannerPage() {
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [view, setView] = useState<PlannerViewMode>("WEEKLY");
  const [anchor, setAnchor] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlannerEvent | null>(null);
  const [pomodoroMin, setPomodoroMin] = useState(25);
  const [pomodoroLeft, setPomodoroLeft] = useState(0);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [error, setError] = useState("");
  const pomodoroMinRef = useRef(pomodoroMin);
  const completedRef = useRef(false);

  pomodoroMinRef.current = pomodoroMin;

  const completePomodoro = useCallback(async () => {
    if (completedRef.current) return;
    completedRef.current = true;
    const minutes = pomodoroMinRef.current;
    if (notifyEnabled) await requestNotificationPermission();
    if (soundEnabled) playTimerCompleteSound();
    if (notifyEnabled) {
      showBrowserNotification(
        "Focus session complete!",
        `Great work — you focused for ${minutes} minute${minutes === 1 ? "" : "s"}.`
      );
    }
    try {
      await api("/planner/pomodoro", { method: "POST", body: JSON.stringify({ durationMin: minutes }) });
    } catch {
      /* session log optional */
    }
  }, [soundEnabled, notifyEnabled]);

  const loadEvents = useCallback(async () => {
    const { from, to } = getRangeForView(view, anchor);
    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
      view,
    });
    const data = await api<PlannerEvent[]>(`/planner/events?${params}`);
    setEvents(data);
  }, [view, anchor]);

  useEffect(() => {
    loadEvents().catch((e) => setError(e instanceof Error ? e.message : "Failed to load events"));
  }, [loadEvents]);

  useEffect(() => {
    if (!pomodoroActive || pomodoroLeft <= 0) return;
    const t = setInterval(() => {
      setPomodoroLeft((s) => {
        if (s <= 1) {
          setPomodoroActive(false);
          completePomodoro();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [pomodoroActive, pomodoroLeft, completePomodoro]);

  const saveEvent = async (data: PlannerEventForm) => {
    if (data.id) {
      await api(`/planner/events/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          startAt: data.startAt,
          endAt: data.endAt,
          priority: data.priority,
          view,
        }),
      });
    } else {
      await api("/planner/events", {
        method: "POST",
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          startAt: data.startAt,
          endAt: data.endAt,
          priority: data.priority,
          view,
        }),
      });
    }
    await loadEvents();
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await api(`/planner/events/${id}`, { method: "DELETE" });
    await loadEvents();
  };

  const toggleComplete = async (event: PlannerEvent) => {
    await api(`/planner/events/${event.id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: !event.completed }),
    });
    await loadEvents();
  };

  const generateTimetable = async () => {
    const res = await api<{ events: PlannerEvent[] }>("/planner/generate-timetable", {
      method: "POST",
      body: JSON.stringify({ hoursPerDay: 3, priorities: ["Mathematics", "Physics", "Chemistry"] }),
    });
    setEvents(res.events);
  };

  const startPomodoro = () => {
    completedRef.current = false;
    if (pomodoroLeft <= 0) setPomodoroLeft(pomodoroMin * 60);
    setPomodoroActive(true);
  };

  const resetPomodoro = () => {
    setPomodoroActive(false);
    setPomodoroLeft(0);
    completedRef.current = false;
  };

  const formatPomodoroDisplay = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold flex items-center gap-2">
                <Calendar className="w-8 h-8 text-brand-500" />
                Study Planner
              </h1>
              <p className="text-[var(--text-secondary)]">Daily · Weekly · Monthly views with drag-free scheduling</p>
            </div>
            <div className="flex gap-2">
              {(["DAILY", "WEEKLY", "MONTHLY"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    view === v ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25" : "glass hover:bg-brand-500/10"
                  }`}
                >
                  {v.charAt(0) + v.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm glass-card">{error}</p>}

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <PlannerCalendar
                view={view}
                anchor={anchor}
                events={events}
                onAnchorChange={setAnchor}
                onSelectEvent={(e) => {
                  setEditing(e);
                  setModalOpen(true);
                }}
                onToggleComplete={toggleComplete}
              />

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={generateTimetable} className="btn-primary flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4" /> AI Generate Timetable
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setModalOpen(true);
                  }}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Event
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-[var(--text-secondary)]">Events in this period</h3>
                {events.length === 0 ? (
                  <p className="text-[var(--text-secondary)] text-sm py-4 text-center glass-card">
                    No events in this {view.toLowerCase()} view. Add one or generate a timetable.
                  </p>
                ) : (
                  events.map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="glass-card flex items-center gap-4"
                    >
                      <div
                        className={`w-1 h-12 rounded-full shrink-0 ${
                          event.priority >= 3 ? "bg-red-500" : event.priority >= 2 ? "bg-amber-500" : "bg-brand-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold truncate ${event.completed ? "line-through opacity-50" : ""}`}>
                          {event.title}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)]">{formatDate(event.startAt)}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={event.completed}
                        onChange={() => toggleComplete(event)}
                        className="w-5 h-5 accent-brand-500 shrink-0"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(event);
                          setModalOpen(true);
                        }}
                        className="p-2 rounded-lg hover:bg-brand-500/10 text-brand-500 shrink-0"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteEvent(event.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            <div className="glass-card text-center h-fit">
              <Timer className="w-10 h-10 text-brand-500 mx-auto mb-4" />
              <h2 className="font-semibold text-lg mb-2">Focus Timer</h2>
              <p className="text-4xl font-mono font-bold gradient-text mb-4">
                {formatPomodoroDisplay(pomodoroLeft > 0 ? pomodoroLeft : pomodoroMin * 60)}
              </p>

              <div className="mb-4 text-left">
                <label className="text-xs text-[var(--text-secondary)] block mb-2">
                  Duration: {pomodoroMin < 60 ? `${pomodoroMin} min` : `${Math.floor(pomodoroMin / 60)}h ${pomodoroMin % 60 ? `${pomodoroMin % 60}m` : ""}`}
                  <span className="float-right">max 5 hrs</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={300}
                  value={pomodoroMin}
                  onChange={(e) => setPomodoroMin(Number(e.target.value))}
                  disabled={pomodoroActive}
                  className="w-full accent-brand-500"
                />
                <div className="flex gap-2 mt-2">
                  {[15, 25, 45, 60, 120].map((m) => (
                    <button
                      key={m}
                      type="button"
                      disabled={pomodoroActive}
                      onClick={() => setPomodoroMin(m)}
                      className={`flex-1 text-xs py-1 rounded-lg ${pomodoroMin === m ? "bg-brand-500 text-white" : "bg-brand-500/10 text-brand-500"}`}
                    >
                      {m < 60 ? `${m}m` : `${m / 60}h`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-center gap-4 mb-4 text-sm">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="accent-brand-500"
                  />
                  <Volume2 className="w-4 h-4" /> Sound
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyEnabled}
                    onChange={(e) => setNotifyEnabled(e.target.checked)}
                    className="accent-brand-500"
                  />
                  <Bell className="w-4 h-4" /> Notify
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={pomodoroActive ? () => setPomodoroActive(false) : startPomodoro}
                  className="btn-primary flex-1"
                >
                  {pomodoroActive ? "Pause" : pomodoroLeft > 0 ? "Resume" : "Start Focus"}
                </button>
                {(pomodoroActive || pomodoroLeft > 0) && (
                  <button type="button" onClick={resetPomodoro} className="btn-secondary px-4">
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <EventModal
          open={modalOpen}
          event={editing}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={saveEvent}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
