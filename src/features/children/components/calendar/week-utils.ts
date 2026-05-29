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

export type EventLayer = "schedule" | "assignment" | "absence" | "event";
export type EventKind = "work" | "substitute" | "indirect";

export type CalendarEvent = {
  layer: EventLayer;
  // Schedule + Assignment are weekly recurring → weekday only.
  // Absence + Event are date-specific (still rendered on a single weekday column
  // when the calendar's week happens to contain that date).
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
  // Event-only: distinguishes regular work, substitute (Einspringen) and
  // indirect (Lehrergespräch/Workshop) entries so EventBlock can color them.
  kind?: EventKind;
};

export function germanWeekRangeLabel(weekStart: Date) {
  const end = addDays(weekStart, 6);
  const fmt = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });
  return `${fmt.format(weekStart)} – ${fmt.format(end)}`;
}

export type PositionedEvent = CalendarEvent & { col: number; cols: number };

export function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h + m / 60;
}

// Column-pack overlapping events per weekday, like Google/Outlook calendars.
// Step 1: greedy lane assignment (each event goes into the leftmost lane that
// is free at its startHour). Step 2: union-find clusters of events connected
// by overlap. Step 3: every event in a cluster reports the cluster's max lane
// count + 1 as its `cols`, so widths are uniform within the cluster.
export function packEvents(events: CalendarEvent[]): PositionedEvent[] {
  const out: PositionedEvent[] = [];
  const byDay = new Map<number, CalendarEvent[]>();
  for (const e of events) {
    if (!byDay.has(e.weekday)) byDay.set(e.weekday, []);
    byDay.get(e.weekday)!.push(e);
  }

  for (const dayEvents of byDay.values()) {
    const sorted = [...dayEvents].sort((a, b) => {
      if (a.startHour !== b.startHour) return a.startHour - b.startHour;
      return b.endHour - b.startHour - (a.endHour - a.startHour);
    });

    // Greedy lane assignment.
    const lanes: number[] = []; // lane endHour
    const laneOf = new Map<CalendarEvent, number>();
    for (const ev of sorted) {
      let placed = -1;
      for (let i = 0; i < lanes.length; i++) {
        if (lanes[i] <= ev.startHour) {
          placed = i;
          lanes[i] = ev.endHour;
          break;
        }
      }
      if (placed === -1) {
        placed = lanes.length;
        lanes.push(ev.endHour);
      }
      laneOf.set(ev, placed);
    }

    // Cluster events connected by overlap (transitively) via union-find.
    const parent = new Map<CalendarEvent, CalendarEvent>();
    for (const e of sorted) parent.set(e, e);
    const find = (e: CalendarEvent): CalendarEvent => {
      const p = parent.get(e)!;
      if (p === e) return e;
      const root = find(p);
      parent.set(e, root);
      return root;
    };
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];
        if (a.startHour < b.endHour && b.startHour < a.endHour) {
          const ra = find(a);
          const rb = find(b);
          if (ra !== rb) parent.set(ra, rb);
        }
      }
    }

    // Cluster size = max lane index + 1, shared by all members.
    const clusterCols = new Map<CalendarEvent, number>();
    for (const e of sorted) {
      const root = find(e);
      const next = (laneOf.get(e) ?? 0) + 1;
      const cur = clusterCols.get(root) ?? 0;
      if (next > cur) clusterCols.set(root, next);
    }

    for (const e of sorted) {
      out.push({
        ...e,
        col: laneOf.get(e)!,
        cols: clusterCols.get(find(e))!,
      });
    }
  }

  return out;
}
