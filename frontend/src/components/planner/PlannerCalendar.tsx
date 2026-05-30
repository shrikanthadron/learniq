"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  PlannerViewMode,
  eventOverlapsDay,
  formatRangeLabel,
  getMonthGridDays,
  sameDay,
  shiftAnchor,
  startOfWeek,
  addDays,
} from "@/lib/planner-utils";

export interface PlannerEventItem {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  completed: boolean;
  priority: number;
}

interface Props {
  view: PlannerViewMode;
  anchor: Date;
  events: PlannerEventItem[];
  onAnchorChange: (d: Date) => void;
  onSelectEvent?: (event: PlannerEventItem) => void;
  onToggleComplete: (event: PlannerEventItem) => void;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

export function PlannerCalendar({ view, anchor, events, onAnchorChange, onSelectEvent, onToggleComplete }: Props) {
  const navigate = (dir: -1 | 1) => onAnchorChange(shiftAnchor(view, anchor, dir));

  if (view === "DAILY") {
    const dayEvents = events.filter((e) => eventOverlapsDay(e.startAt, e.endAt, anchor));
    return (
      <div className="glass-card space-y-4">
        <CalendarHeader label={formatRangeLabel(view, anchor)} onPrev={() => navigate(-1)} onNext={() => navigate(1)} />
        <div className="space-y-1 max-h-[420px] overflow-y-auto">
          {HOURS.map((hour) => {
            const slotEvents = dayEvents.filter((e) => new Date(e.startAt).getHours() === hour);
            return (
              <div key={hour} className="flex gap-3 min-h-[52px] border-b border-[var(--glass-border)]/50 py-2">
                <span className="text-xs text-[var(--text-secondary)] w-12 shrink-0 pt-1">
                  {hour.toString().padStart(2, "0")}:00
                </span>
                <div className="flex-1 space-y-1">
                  {slotEvents.length === 0 ? (
                    <div className="h-8 rounded-lg border border-dashed border-[var(--glass-border)]/40" />
                  ) : (
                    slotEvents.map((e) => (
                      <EventChip key={e.id} event={e} onToggle={onToggleComplete} onClick={() => onSelectEvent?.(e)} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (view === "WEEKLY") {
    const weekStart = startOfWeek(anchor);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    return (
      <div className="glass-card space-y-4">
        <CalendarHeader label={formatRangeLabel(view, anchor)} onPrev={() => navigate(-1)} onNext={() => navigate(1)} />
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dayEvents = events.filter((e) => eventOverlapsDay(e.startAt, e.endAt, day));
            const isToday = sameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={clsx(
                  "rounded-xl border p-2 min-h-[120px]",
                  isToday ? "border-brand-500 bg-brand-500/10" : "border-[var(--glass-border)]"
                )}
              >
                <p className={clsx("text-xs font-semibold mb-2", isToday && "text-brand-500")}>
                  {day.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
                </p>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => onSelectEvent?.(e)}
                      className={clsx(
                        "w-full text-left text-[10px] px-1.5 py-1 rounded truncate",
                        e.completed ? "bg-emerald-500/20 line-through opacity-60" : "bg-brand-500/20"
                      )}
                    >
                      {e.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="text-[10px] text-[var(--text-secondary)]">+{dayEvents.length - 3} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const gridDays = getMonthGridDays(anchor);
  const month = anchor.getMonth();
  return (
    <div className="glass-card space-y-4">
      <CalendarHeader label={formatRangeLabel(view, anchor)} onPrev={() => navigate(-1)} onNext={() => navigate(1)} />
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--text-secondary)] mb-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {gridDays.map((day) => {
          const dayEvents = events.filter((e) => eventOverlapsDay(e.startAt, e.endAt, day));
          const inMonth = day.getMonth() === month;
          const isToday = sameDay(day, new Date());
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onAnchorChange(day)}
              className={clsx(
                "aspect-square rounded-lg p-1 text-left transition hover:bg-brand-500/10",
                !inMonth && "opacity-40",
                isToday && "ring-2 ring-brand-500"
              )}
            >
              <span className="text-xs font-medium">{day.getDate()}</span>
              <div className="flex flex-wrap gap-0.5 mt-1">
                {dayEvents.slice(0, 3).map((e) => (
                  <span
                    key={e.id}
                    className={clsx(
                      "w-1.5 h-1.5 rounded-full",
                      e.priority >= 3 ? "bg-red-500" : e.priority >= 2 ? "bg-amber-500" : "bg-brand-500"
                    )}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CalendarHeader({ label, onPrev, onNext }: { label: string; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <button type="button" onClick={onPrev} className="p-2 rounded-lg hover:bg-brand-500/10">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h3 className="font-semibold text-sm md:text-base">{label}</h3>
      <button type="button" onClick={onNext} className="p-2 rounded-lg hover:bg-brand-500/10">
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function EventChip({
  event,
  onToggle,
  onClick,
}: {
  event: PlannerEventItem;
  onToggle: (e: PlannerEventItem) => void;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-brand-500/15 px-2 py-1.5">
      <input
        type="checkbox"
        checked={event.completed}
        onChange={() => onToggle(event)}
        className="w-4 h-4 accent-brand-500"
      />
      <button type="button" onClick={onClick} className={clsx("flex-1 text-left text-sm truncate", event.completed && "line-through opacity-60")}>
        {event.title}
      </button>
    </div>
  );
}
