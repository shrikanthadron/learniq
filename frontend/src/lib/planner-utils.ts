export type PlannerViewMode = "DAILY" | "WEEKLY" | "MONTHLY";

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(x, diff);
}

export function endOfWeek(d: Date) {
  return endOfDay(addDays(startOfWeek(d), 6));
}

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date) {
  return endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function getRangeForView(view: PlannerViewMode, anchor: Date) {
  if (view === "DAILY") return { from: startOfDay(anchor), to: endOfDay(anchor) };
  if (view === "WEEKLY") return { from: startOfWeek(anchor), to: endOfWeek(anchor) };
  return { from: startOfMonth(anchor), to: endOfMonth(anchor) };
}

export function formatRangeLabel(view: PlannerViewMode, anchor: Date) {
  if (view === "DAILY") {
    return anchor.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }
  if (view === "WEEKLY") {
    const from = startOfWeek(anchor);
    const to = endOfWeek(anchor);
    return `${from.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${to.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
  }
  return anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function shiftAnchor(view: PlannerViewMode, anchor: Date, dir: -1 | 1) {
  if (view === "DAILY") return addDays(anchor, dir);
  if (view === "WEEKLY") return addDays(anchor, dir * 7);
  return new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1);
}

export function getMonthGridDays(anchor: Date) {
  const first = startOfMonth(anchor);
  const start = startOfWeek(first);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) days.push(addDays(start, i));
  return days;
}

export function eventOverlapsDay(eventStart: string, eventEnd: string, day: Date) {
  const s = new Date(eventStart);
  const e = new Date(eventEnd);
  const d0 = startOfDay(day);
  const d1 = endOfDay(day);
  return s <= d1 && e >= d0;
}

export function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
