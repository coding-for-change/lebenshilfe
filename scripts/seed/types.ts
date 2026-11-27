import { EventType, Role } from "../../src/generated/prisma";

// A seed dataset is pure data: no Prisma calls, no ordering logic. The engine
// (scripts/seed/engine.ts) knows how to insert it. One dataset per instance —
// Munich for local development, Hamburg for the public demo — so the two never
// drift apart in behaviour, only in content.
//
// Dates are expressed as offsets instead of absolute days: a dataset seeded
// today and the same dataset seeded in six months both produce "last week" and
// "yesterday", which is what keeps a long-running demo looking current.

export type SeedUser = {
  email: string;
  password: string;
  name: string;
  role: Role;
};

export type SeedPendingInvitation = {
  email: string;
  name: string;
  role: Role;
  token: string;
  weeklyHours: number;
};

export type SeedKostentraeger = {
  id: string;
  name: string;
  email: string;
  address: string;
};

export type SeedHolidayPlan = {
  id: string;
  name: string;
  entries: {
    name: string | null;
    /** Days from today; negative is in the past. */
    startOffset: number;
    endOffset: number;
  }[];
};

export type SeedSchool = {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  holidayPlanId: string | null;
};

export type SeedChild = {
  id: string;
  firstName: string;
  lastName: string;
  leosOne: boolean;
  bescheid: string | null;
  sbIb: string | null;
  schweigepflichtsentbindung: boolean;
  bemerkung: string | null;
  schoolId: string | null;
  kostentraegerId: string | null;
};

/** weekday uses Mon=0..Sun=6, matching Schedule.weekday across the app. */
export type SeedTimeBlock = {
  weekday: number;
  startTime: string;
  endTime: string;
};

export type SeedAbsence = {
  childId: string;
  /** Days from today. Weekend dates are skipped by the engine. */
  offset: number;
  note: string | null;
};

export type SeedProfileDetails = {
  leosOne: boolean;
  outlook: boolean;
  weeklyHours: number;
  /** How many weekdays ago the Einführungstag took place. */
  introductionDayWeekdaysAgo: number;
  zvNeuNachBescheid: boolean;
  zvNeuNote?: string;
};

export type SeedAssignment = {
  childId: string;
  /** Resolved to a SchoolAssistantProfile id by the engine. */
  profileEmail: string;
  weekday: number;
  startTime: string;
  endTime: string;
  tandem: boolean;
};

export type SeedVertretung = {
  childId: string;
  substituteEmail: string;
  /** How many weekdays ago — kept in the past so nothing lands in the future. */
  weekdaysAgo: number;
};

export type SeedEvent = {
  /** Days from today. Weekend dates are skipped by the engine. */
  offset: number;
  child: string | null;
  type: EventType;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
};

export type SeedWorkshop = {
  id: string;
  name: string;
  description: string;
};

export type SeedAttendance = {
  workshopId: string;
  profileEmail: string;
  weekdaysAgo: number;
};

export type SeedDataset = {
  /** Shown in the seed's console summary, e.g. "München (Entwicklung)". */
  label: string;
  users: SeedUser[];
  pendingInvitation: SeedPendingInvitation;
  kostentraeger: SeedKostentraeger[];
  holidayPlans: SeedHolidayPlan[];
  schools: SeedSchool[];
  children: SeedChild[];
  /** Keyed by child id — the child's school timetable. */
  childSchedules: Record<string, SeedTimeBlock[]>;
  absences: SeedAbsence[];
  /** Keyed by Schulbegleiter email. */
  profileDetails: Record<string, SeedProfileDetails>;
  assignments: SeedAssignment[];
  vertretungen: SeedVertretung[];
  /** Keyed by Schulbegleiter email — their timesheet entries around today. */
  eventPlans: Record<string, SeedEvent[]>;
  /**
   * Fills the gaps around `eventPlans` with one WORK entry per assigned weekday,
   * derived from each assistant's own assignments. A demo needs weeks of history
   * to look lived-in; writing that out by hand would be hundreds of literals that
   * go stale the moment an assignment changes. The engine skips weekends, days
   * already covered by an explicit entry, the child's absence days, and school
   * holidays, so the generated history stays consistent with the rest.
   */
  autoEvents?: {
    emails: string[];
    /** Days from today, both negative; `toOffset` is inclusive. */
    fromOffset: number;
    toOffset: number;
  };
  monthlyReports: { supervisorName: string; emails: string[] };
  workshops: SeedWorkshop[];
  attendances: SeedAttendance[];
};
