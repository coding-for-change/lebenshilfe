export const WEEKDAYS_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
export const WEEKDAYS_LONG = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
];
export const MONTHS_LONG = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];
export const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
];

/** Monday-based weekday index: Mon=0 … Sun=6. */
export function weekdayIndex(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

/** UTC midnight of the date represented by any Date. */
export function startOfDayUtc(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/** Monday of the ISO week containing `date` (UTC). */
export function startOfWeekUtc(date: Date): Date {
  const d = startOfDayUtc(date);
  d.setUTCDate(d.getUTCDate() - weekdayIndex(d));
  return d;
}

/** ISO 8601 calendar-week number. */
export function isoWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function addMonths(date: Date, months: number): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + months,
      date.getUTCDate(),
    ),
  );
}

export function isSameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function formatDateLong(date: Date): string {
  return `${WEEKDAYS_LONG[weekdayIndex(date)]}, ${date.getUTCDate()}. ${
    MONTHS_LONG[date.getUTCMonth()]
  }`;
}

export function parseIsoDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** "HH:MM" → minutes since midnight. */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function formatDuration(startTime: string, endTime: string): string {
  const mins = timeToMinutes(endTime) - timeToMinutes(startTime);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function relativeLabel(date: Date, today: Date): string {
  const diff = Math.round(
    (startOfDayUtc(date).getTime() - startOfDayUtc(today).getTime()) /
      86_400_000,
  );
  if (diff === 0) return "Heute";
  if (diff === -1) return "Gestern";
  if (diff === 1) return "Morgen";
  if (diff < 0) return `${Math.abs(diff)} Tage zurück`;
  return `${diff} Tage voraus`;
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}
