"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Plus, Timer, Sparkles, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { DashboardLayout } from "@/components/ui/DashboardLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EventModal, PlannerEventForm } from "@/components/planner/EventModal";

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
  const [view, setView] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("WEEKLY");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlannerEvent | null>(null);
  const [pomodoroMin, setPomodoroMin] = useState(25);
  const [pomodoroLeft, setPomodoroLeft] = useState(0);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [error, setError] = useState("");

  const loadEvents = useCallback(async () => {
    const data = await api<PlannerEvent[]>("/planner/events");
    setEvents(data);
  }, []);

  useEffect(() => {
    loadEvents().catch((e) => setError(e instanceof Error ? e.message : "Failed to load events"));
  }, [loadEvents]);

  useEffect(() => {
    if (!pomodoroActive || pomodoroLeft <= 0) return;
    const t = setInterval(() => {
      setPomodoroLeft((s) => {
        if (s <= 1) {
          setPomodoroActive(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [pomodoroActive, pomodoroLeft]);

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
    setPomodoroLeft(pomodoroMin * 60);
    setPomodoroActive(true);
    api("/planner/pomodoro", { method: "POST", body: JSON.stringify({ durationMin: pomodoroMin }) }).catch(() => {});
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
              <p className="text-[var(--text-secondary)]">Add, edit, delete events · AI timetable · Pomodoro</p>
            </div>
            <div className="flex gap-2">
              {(["DAILY", "WEEKLY", "MONTHLY"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-2 rounded-xl text-sm transition ${
                    view === v ? "bg-brand-500 text-white" : "glass"
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
              <div className="flex flex-wrap gap-3">
                <button onClick={generateTimetable} className="btn-primary flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4" /> AI Generate Timetable
                </button>
                <button
                  onClick={() => {
                    setEditing(null);
                    setModalOpen(true);
                  }}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Event
                </button>
              </div>

              {events.length === 0 && (
                <p className="text-[var(--text-secondary)] text-sm py-8 text-center glass-card">
                  No events yet. Click <strong>Add Event</strong> to create one.
                </p>
              )}

              {events.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
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
                    <p className="text-sm text-[var(--text-secondary)]">
                      {formatDate(event.startAt)} —{" "}
                      {new Date(event.endAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </p>
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
              ))}
            </div>

            <div className="glass-card text-center h-fit">
              <Timer className="w-10 h-10 text-brand-500 mx-auto mb-4" />
              <h2 className="font-semibold text-lg mb-2">Pomodoro Focus</h2>
              <p className="text-4xl font-mono font-bold gradient-text mb-4">
                {String(Math.floor(pomodoroLeft / 60)).padStart(2, "0")}:
                {String(pomodoroLeft % 60).padStart(2, "0")}
              </p>
              <select
                value={pomodoroMin}
                onChange={(e) => setPomodoroMin(Number(e.target.value))}
                className="input-field mb-4 text-center"
                disabled={pomodoroActive}
              >
                <option value={25}>25 min</option>
                <option value={45}>45 min</option>
                <option value={15}>15 min</option>
              </select>
              <button
                onClick={pomodoroActive ? () => setPomodoroActive(false) : startPomodoro}
                className="btn-primary w-full"
              >
                {pomodoroActive ? "Pause" : "Start Focus"}
              </button>
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
