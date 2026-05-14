import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const monthYearLongFormatter = new Intl.DateTimeFormat("de-DE", {
  year: "numeric",
  month: "long",
});

const shortDateWithWeekdayFormatter = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
});

// `YYYY-MM-DD` strings are interpreted as local midnight to avoid a TZ shift
// pulling the date back a day in negative-UTC zones.
function toDate(value: Date | string): Date {
  if (value instanceof Date) return value;
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
}

export function formatDate(value: Date | string): string {
  return dateFormatter.format(toDate(value));
}

export function formatMonthYearLong(value: Date | string): string {
  return monthYearLongFormatter.format(toDate(value));
}

export function formatShortDateWithWeekday(value: Date | string): string {
  return shortDateWithWeekdayFormatter.format(toDate(value));
}

/** YYYY-MM-DD using UTC components. Use for `@db.Date` values from Prisma. */
export function formatIsoDateUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** YYYY-MM-DD using local components. Use for user-picked Date values. */
export function formatIsoDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
