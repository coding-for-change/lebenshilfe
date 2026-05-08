const monthFormatter = new Intl.DateTimeFormat("de-DE", {
  year: "numeric",
  month: "long",
});

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
});

export type HasDateAndTimes = {
  date: string; // YYYY-MM-DD
  startTime: string | null;
  endTime: string | null;
};

export function formatMonthLabel(yearMonth: string): string {
  // yearMonth: "YYYY-MM"
  const [y, m] = yearMonth.split("-").map(Number);
  return monthFormatter.format(new Date(Date.UTC(y, m - 1, 1)));
}

export function formatDayLabel(isoDate: string): string {
  return dateFormatter.format(new Date(`${isoDate}T00:00:00`));
}

export function monthKeyOf(isoDate: string): string {
  // isoDate: YYYY-MM-DD
  return isoDate.slice(0, 7);
}

export function currentMonthKey(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function addMonths(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  const ny = d.getUTCFullYear();
  const nm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${ny}-${nm}`;
}

export function compareMonthKey(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function groupByMonth<T extends HasDateAndTimes>(
  events: T[],
): { key: string; label: string; rows: T[] }[] {
  const groups = new Map<string, { label: string; rows: T[] }>();
  for (const e of events) {
    const key = monthKeyOf(e.date);
    if (!groups.has(key)) {
      groups.set(key, { label: formatMonthLabel(key), rows: [] });
    }
    groups.get(key)!.rows.push(e);
  }
  return [...groups.entries()].map(([key, val]) => ({ key, ...val }));
}

export function totalHours<T extends HasDateAndTimes>(events: T[]): string {
  let mins = 0;
  for (const e of events) {
    if (!e.startTime || !e.endTime) continue;
    const [h1, m1] = e.startTime.split(":").map(Number);
    const [h2, m2] = e.endTime.split(":").map(Number);
    mins += h2 * 60 + m2 - (h1 * 60 + m1);
  }
  return (mins / 60).toFixed(2).replace(".", ",");
}
