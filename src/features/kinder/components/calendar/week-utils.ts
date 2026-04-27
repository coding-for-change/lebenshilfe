// Shared helpers for the Kinder week calendar.

export const HOUR_HEIGHT = 48; // px
export const START_HOUR = 6; // 06:00
export const END_HOUR = 21; // exclusive — last visible band starts 20:00
export const DAY_LABELS_DE = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
] as const;
export const DAY_SHORT_DE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function startOfWeekMonday(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const dow = date.getDay(); // 0=Sun..6=Sat
  const diff = dow === 0 ? -6 : 1 - dow;
  date.setDate(date.getDate() + diff);
  return date;
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * MS_PER_DAY);
}

export function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Convert "HH:MM" to fractional hours (e.g. "08:30" → 8.5).
export function timeToHours(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h + m / 60;
}

export function hoursToTime(hours: number): string {
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Snap to 15-minute intervals.
export function snapHours(h: number): number {
  return Math.round(h * 4) / 4;
}

// Clamp into the visible window [START_HOUR, END_HOUR].
export function clampHours(h: number): number {
  return Math.max(START_HOUR, Math.min(END_HOUR, h));
}

export type EventLayer = "schedule" | "assignment" | "absence";

export type CalendarEvent = {
  layer: EventLayer;
  // Schedule + Assignment are weekly recurring → weekday only.
  // Absence is date-specific.
  weekday: number; // 0..6 (Mon..Sun)
  startHour: number; // for full-day absences: START_HOUR
  endHour: number; // for full-day absences: END_HOUR
  // Reference back to the underlying record id.
  id: string;
  // Display fields
  label: string;
  sublabel?: string;
  // Assignment-only
  tandem?: boolean;
};

export function germanWeekRangeLabel(weekStart: Date) {
  const end = addDays(weekStart, 6);
  const fmt = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });
  return `${fmt.format(weekStart)} – ${fmt.format(end)}`;
}
