/**
 * Pure formatting helpers for the Einsatznachweis export.
 *
 * No runtime dependencies — safe to import from the server (facade, render)
 * and from client components (the export dialog) alike.
 */

export const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mrz",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
] as const;

/** Sunday-first, matching `Date.prototype.getUTCDay()`. */
export const WEEKDAYS_SHORT = [
  "So",
  "Mo",
  "Di",
  "Mi",
  "Do",
  "Fr",
  "Sa",
] as const;

/** "Mrz 26" — short month plus two-digit year, as in the Tabelle-7 template. */
export function monthLabel(year: number, month: number): string {
  return `${MONTHS_SHORT[month - 1]} ${String(year).slice(-2)}`;
}

/** UTC calendar date formatted as "DD.MM.YY". */
export function dateLabelShort(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = String(date.getUTCFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
}

export function weekdayShort(date: Date): string {
  return WEEKDAYS_SHORT[date.getUTCDay()];
}

export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Minutes since midnight for a "HH:MM" string; 0 if malformed. */
export function hhmmToMinutes(value: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Hours between two "HH:MM" strings, rounded to two decimals. */
export function durationHours(start: string, end: string): number {
  const minutes = hhmmToMinutes(end) - hhmmToMinutes(start);
  return roundHours(minutes / 60);
}

/**
 * Shifts a "HH:MM" time by `deltaMinutes`, clamped to a single day
 * [00:00, 23:59]. Used for the Vor-/Nachviertelstunde billing convention.
 */
export function shiftTime(value: string, deltaMinutes: number): string {
  const total = Math.max(
    0,
    Math.min(24 * 60 - 1, hhmmToMinutes(value) + deltaMinutes),
  );
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function roundHours(value: number): number {
  return Math.round(value * 100) / 100;
}

/** German decimal formatting, e.g. `1.5` -> `"1,50"`. */
export function formatHoursDe(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

/** Strips characters that are unsafe in a file name. */
export function sanitizeFileName(value: string): string {
  return value
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}
