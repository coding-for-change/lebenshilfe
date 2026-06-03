// COD-50 — "Übersicht problematischer Fälle".
//
// Pure detection logic for the admin Handlungsbedarf dashboard. Given the
// already-loaded children (with their assignments, schedules, absences and
// Vertretungen) plus the SICK and WORK events of a single week, it derives a
// flat, sorted list of cases that need attention.
//
// This module is intentionally side-effect free and infrastructure-agnostic so
// it stays trivially testable: the ChildrenFacade fetches the data, this
// function turns it into cases, the Action ships the result to the UI.

import { addDays, parseIsoDate, timeToMinutes } from "@/lib/dates";
import { formatIsoDateUtc } from "@/lib/utils";
import type { SerializedChild } from "./serialize";

/** Booked minutes must exceed the Stundenplan by more than this to be flagged. */
export const HOURS_OVER_SCHEDULE_THRESHOLD_MIN = 60;

export type HandlungsbedarfSeverity = "critical" | "warning" | "info";

export type HandlungsbedarfCategory = "krankheit" | "weitere" | "stammdaten";

export type HandlungsbedarfKind =
  | "sa-sick-uncovered"
  | "sa-sick-covered"
  | "sa-sick-no-children"
  | "child-absent"
  | "child-absent-but-work"
  | "substitute-sick"
  | "schedule-unassigned"
  | "hours-over-schedule"
  | "missing-schweigepflicht"
  | "missing-bescheid";

/**
 * Everything the inline "Vertretung zuweisen" dialog needs. `currentSubstituteUserId`
 * is null when no Vertretung exists yet (→ create), or the existing substitute
 * when one is in place but needs replacing (→ update).
 */
export type VertretungAssignTarget = {
  childId: string;
  childName: string;
  date: string; // YYYY-MM-DD
  currentSubstituteUserId: string | null;
  scheduleLabel: string; // e.g. "08:00–14:00" or "Ganztägig"
};

export type HandlungsbedarfCase = {
  id: string;
  category: HandlungsbedarfCategory;
  severity: HandlungsbedarfSeverity;
  kind: HandlungsbedarfKind;
  title: string;
  description: string;
  date: string | null; // YYYY-MM-DD, or null for non-date-bound (Stammdaten) cases
  weekday: number | null; // 0..6 (Mon..Sun), or null
  childId: string | null;
  childName: string | null;
  schoolAssistantName: string | null;
  assign: VertretungAssignTarget | null; // present → render inline assign action
};

export type HandlungsbedarfCounts = {
  critical: number;
  warning: number;
  info: number;
};

export type HandlungsbedarfResult = {
  weekStart: string; // ISO Monday
  weekEnd: string; // ISO Sunday
  cases: HandlungsbedarfCase[];
  counts: HandlungsbedarfCounts;
};

export type SickEventLite = {
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
};

export type WorkEventLite = {
  childId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  startTime: string | null;
  endTime: string | null;
};

export type DetectHandlungsbedarfInput = {
  weekStartIso: string; // ISO Monday (YYYY-MM-DD)
  children: SerializedChild[];
  sickEvents: SickEventLite[];
  workEvents: WorkEventLite[];
};

const SEVERITY_RANK: Record<HandlungsbedarfSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

function scheduleLabelForWeekday(
  child: SerializedChild,
  weekday: number,
): string {
  const blocks = child.schedules
    .filter((s) => s.weekday === weekday)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  if (blocks.length === 0) return "Ganztägig";
  return blocks.map((b) => `${b.startTime}–${b.endTime}`).join(", ");
}

function minutesForBlocks(
  blocks: { startTime: string; endTime: string }[],
): number {
  return blocks.reduce(
    (sum, b) =>
      sum + Math.max(0, timeToMinutes(b.endTime) - timeToMinutes(b.startTime)),
    0,
  );
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function detectHandlungsbedarf(
  input: DetectHandlungsbedarfInput,
): HandlungsbedarfResult {
  const { weekStartIso, children, sickEvents, workEvents } = input;

  const monday = parseIsoDate(weekStartIso);
  // 7 ISO dates Mon..Sun; the array index IS the Mon=0 weekday index.
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    formatIsoDateUtc(addDays(monday, i)),
  );
  const weekDateSet = new Set(weekDates);
  const weekdayOf = new Map<string, number>();
  weekDates.forEach((iso, i) => weekdayOf.set(iso, i));

  // --- index SICK events: date -> Set<userId> (+ name lookup) ---
  const sickByDate = new Map<string, Set<string>>();
  const sickUserName = new Map<string, string>();
  for (const ev of sickEvents) {
    if (!weekDateSet.has(ev.date)) continue;
    if (!sickByDate.has(ev.date)) sickByDate.set(ev.date, new Set());
    sickByDate.get(ev.date)!.add(ev.userId);
    sickUserName.set(ev.userId, ev.userName);
  }
  const isSick = (userId: string, date: string) =>
    sickByDate.get(date)?.has(userId) ?? false;

  // --- index WORK events: `${childId}|${date}` -> events ---
  const workByChildDate = new Map<string, WorkEventLite[]>();
  for (const ev of workEvents) {
    if (!weekDateSet.has(ev.date)) continue;
    const key = `${ev.childId}|${ev.date}`;
    if (!workByChildDate.has(key)) workByChildDate.set(key, []);
    workByChildDate.get(key)!.push(ev);
  }

  const cases: HandlungsbedarfCase[] = [];

  for (const child of children) {
    const childName = `${child.firstName} ${child.lastName}`;

    // Absences that fall inside the visible week.
    const absentDates = new Set(
      child.absences.map((a) => a.date).filter((d) => weekDateSet.has(d)),
    );

    // Vertretungen within the week, one (the first) substitute per date.
    const vertretungByDate = new Map<
      string,
      { substituteUserId: string; substituteUserName: string }
    >();
    for (const v of child.vertretungen) {
      if (!weekDateSet.has(v.date)) continue;
      if (!vertretungByDate.has(v.date)) {
        vertretungByDate.set(v.date, {
          substituteUserId: v.substituteUserId,
          substituteUserName: v.substituteUserName,
        });
      }
    }

    // Assigned Schulbegleiter per weekday (deduped by user).
    const assignedUsersByWeekday = new Map<
      number,
      { userId: string; userName: string }[]
    >();
    for (const a of child.assignments) {
      if (!assignedUsersByWeekday.has(a.weekday)) {
        assignedUsersByWeekday.set(a.weekday, []);
      }
      const arr = assignedUsersByWeekday.get(a.weekday)!;
      if (!arr.some((u) => u.userId === a.userId)) {
        arr.push({ userId: a.userId, userName: a.userName });
      }
    }

    const scheduleWeekdays = new Set(child.schedules.map((s) => s.weekday));

    // === Kind krank/abwesend (and the "but WORK was booked" variant) ===
    for (const date of absentDates) {
      const weekday = weekdayOf.get(date)!;
      const work = workByChildDate.get(`${child.id}|${date}`) ?? [];
      if (work.length > 0) {
        const names = Array.from(new Set(work.map((w) => w.userName))).join(
          ", ",
        );
        cases.push({
          id: `child-absent-but-work:${child.id}:${date}`,
          category: "weitere",
          severity: "warning",
          kind: "child-absent-but-work",
          title: "Kind krank, aber Einsatz gebucht",
          description: `${childName} ist als abwesend markiert, ${names} hat an diesem Tag dennoch einen Einsatz gebucht.`,
          date,
          weekday,
          childId: child.id,
          childName,
          schoolAssistantName: names,
          assign: null,
        });
      } else {
        cases.push({
          id: `child-absent:${child.id}:${date}`,
          category: "krankheit",
          severity: "info",
          kind: "child-absent",
          title: "Kind abwesend / krank",
          description: `${childName} ist an diesem Tag als abwesend markiert.`,
          date,
          weekday,
          childId: child.id,
          childName,
          schoolAssistantName: null,
          assign: null,
        });
      }
    }

    // === Per-weekday rules within the visible week ===
    for (let weekday = 0; weekday < 7; weekday++) {
      const date = weekDates[weekday];
      const childAbsent = absentDates.has(date);
      const vertretung = vertretungByDate.get(date) ?? null;
      const assignedUsers = assignedUsersByWeekday.get(weekday) ?? [];

      // --- Schulbegleiter krank → covered / uncovered ---
      for (const u of assignedUsers) {
        if (!isSick(u.userId, date)) continue;
        if (childAbsent) continue; // child is away too → no substitute needed
        if (vertretung) {
          cases.push({
            id: `sa-sick-covered:${u.userId}:${child.id}:${date}`,
            category: "krankheit",
            severity: "info",
            kind: "sa-sick-covered",
            title: "Schulbegleiter krank — Vertretung vorhanden",
            description: `${u.userName} ist krank. ${childName} wird von ${vertretung.substituteUserName} vertreten.`,
            date,
            weekday,
            childId: child.id,
            childName,
            schoolAssistantName: u.userName,
            assign: null,
          });
        } else {
          cases.push({
            id: `sa-sick-uncovered:${u.userId}:${child.id}:${date}`,
            category: "krankheit",
            severity: "critical",
            kind: "sa-sick-uncovered",
            title: "Schulbegleiter krank — keine Vertretung",
            description: `${u.userName} ist krank. ${childName} hat noch keine Vertretung.`,
            date,
            weekday,
            childId: child.id,
            childName,
            schoolAssistantName: u.userName,
            assign: {
              childId: child.id,
              childName,
              date,
              currentSubstituteUserId: null,
              scheduleLabel: scheduleLabelForWeekday(child, weekday),
            },
          });
        }
      }

      // --- Vertretung, deren Vertreter selbst krank ist ---
      if (
        vertretung &&
        !childAbsent &&
        isSick(vertretung.substituteUserId, date)
      ) {
        cases.push({
          id: `substitute-sick:${child.id}:${date}`,
          category: "krankheit",
          severity: "critical",
          kind: "substitute-sick",
          title: "Vertreter krank",
          description: `Die Vertretung für ${childName} (${vertretung.substituteUserName}) ist an diesem Tag selbst krank.`,
          date,
          weekday,
          childId: child.id,
          childName,
          schoolAssistantName: vertretung.substituteUserName,
          assign: {
            childId: child.id,
            childName,
            date,
            currentSubstituteUserId: vertretung.substituteUserId,
            scheduleLabel: scheduleLabelForWeekday(child, weekday),
          },
        });
      }

      // --- Stundenplan-Block ohne zugewiesenen Schulbegleiter ---
      if (
        scheduleWeekdays.has(weekday) &&
        assignedUsers.length === 0 &&
        !childAbsent &&
        !vertretung
      ) {
        cases.push({
          id: `schedule-unassigned:${child.id}:${date}`,
          category: "weitere",
          severity: "warning",
          kind: "schedule-unassigned",
          title: "Stundenplan-Block ohne Schulbegleiter",
          description: `${childName} hat laut Stundenplan einen Block (${scheduleLabelForWeekday(
            child,
            weekday,
          )}), aber keinen zugewiesenen Schulbegleiter.`,
          date,
          weekday,
          childId: child.id,
          childName,
          schoolAssistantName: null,
          assign: {
            childId: child.id,
            childName,
            date,
            currentSubstituteUserId: null,
            scheduleLabel: scheduleLabelForWeekday(child, weekday),
          },
        });
      }

      // --- Gebuchte Stunden deutlich über Stundenplan ---
      if (scheduleWeekdays.has(weekday)) {
        const scheduledMin = minutesForBlocks(
          child.schedules.filter((s) => s.weekday === weekday),
        );
        const work = workByChildDate.get(`${child.id}|${date}`) ?? [];
        const bookedMin = work.reduce((sum, w) => {
          if (!w.startTime || !w.endTime) return sum;
          return (
            sum +
            Math.max(0, timeToMinutes(w.endTime) - timeToMinutes(w.startTime))
          );
        }, 0);
        if (
          scheduledMin > 0 &&
          bookedMin > scheduledMin + HOURS_OVER_SCHEDULE_THRESHOLD_MIN
        ) {
          cases.push({
            id: `hours-over-schedule:${child.id}:${date}`,
            category: "weitere",
            severity: "warning",
            kind: "hours-over-schedule",
            title: "Gebuchte Stunden über Stundenplan",
            description: `Für ${childName} wurden ${formatMinutes(
              bookedMin,
            )} gebucht, der Stundenplan sieht ${formatMinutes(
              scheduledMin,
            )} vor.`,
            date,
            weekday,
            childId: child.id,
            childName,
            schoolAssistantName: null,
            assign: null,
          });
        }
      }
    }

    // === Stammdaten-Hinweise (not tied to the visible week) ===
    if (!child.schweigepflichtsentbindung) {
      cases.push({
        id: `missing-schweigepflicht:${child.id}`,
        category: "stammdaten",
        severity: "warning",
        kind: "missing-schweigepflicht",
        title: "Fehlende Schweigepflichtsentbindung",
        description: `Für ${childName} liegt keine Schweigepflichtsentbindung vor.`,
        date: null,
        weekday: null,
        childId: child.id,
        childName,
        schoolAssistantName: null,
        assign: null,
      });
    }
    if (!child.bescheid || child.bescheid.trim() === "") {
      cases.push({
        id: `missing-bescheid:${child.id}`,
        category: "stammdaten",
        severity: "info",
        kind: "missing-bescheid",
        title: "Kein Bescheid hinterlegt",
        description: `Für ${childName} ist kein Bescheid hinterlegt.`,
        date: null,
        weekday: null,
        childId: child.id,
        childName,
        schoolAssistantName: null,
        assign: null,
      });
    }
  }

  // Surface sick Schulbegleiter who have NO assigned child on the sick day, so
  // the illness still shows up in the list. (Days where an assignment exists are
  // already represented by covered/uncovered cases above.)
  const sickDaysWithAssignment = new Set<string>();
  for (const child of children) {
    for (const a of child.assignments) {
      const date = weekDates[a.weekday];
      if (date && isSick(a.userId, date)) {
        sickDaysWithAssignment.add(`${a.userId}|${date}`);
      }
    }
  }
  for (const [date, userSet] of sickByDate) {
    const weekday = weekdayOf.get(date)!;
    for (const userId of userSet) {
      if (sickDaysWithAssignment.has(`${userId}|${date}`)) continue;
      cases.push({
        id: `sa-sick-no-children:${userId}:${date}`,
        category: "krankheit",
        severity: "info",
        kind: "sa-sick-no-children",
        title: "Schulbegleiter krank",
        description: `${
          sickUserName.get(userId) ?? "Schulbegleiter"
        } ist krank — keine zugewiesenen Kinder an diesem Tag.`,
        date,
        weekday,
        childId: null,
        childName: null,
        schoolAssistantName: sickUserName.get(userId) ?? null,
        assign: null,
      });
    }
  }

  // Sort by severity, then by date (non-date-bound cases last), then title.
  cases.sort((a, b) => {
    if (SEVERITY_RANK[a.severity] !== SEVERITY_RANK[b.severity]) {
      return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    }
    const da = a.date ?? "9999-99-99";
    const db = b.date ?? "9999-99-99";
    if (da !== db) return da.localeCompare(db);
    return a.title.localeCompare(b.title);
  });

  const counts: HandlungsbedarfCounts = { critical: 0, warning: 0, info: 0 };
  for (const c of cases) counts[c.severity]++;

  return {
    weekStart: weekDates[0],
    weekEnd: weekDates[6],
    cases,
    counts,
  };
}
