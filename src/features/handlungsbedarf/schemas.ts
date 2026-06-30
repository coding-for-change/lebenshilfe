export type ProblemFlag =
  | SbSickNoSubstituteFlag
  | ChildAbsentWorkBookedFlag
  | ChildAbsentInfoFlag
  | SubstituteAlsoSickFlag
  | ScheduleBlockUnassignedFlag
  | BookedHoursOverScheduleFlag
  | MissingSchweigepflichtFlag;

/**
 * Krankheit: SB is sick on a date but one of their normally-assigned children
 * has no ChildVertretung covering it.
 */
export type SbSickNoSubstituteFlag = {
  kind: "SB_SICK_NO_SUBSTITUTE";
  /** ISO YYYY-MM-DD */
  date: string;
  sbUserId: string;
  sbName: string;
  childId: string;
  childName: string;
};

/**
 * Krankheit: child is marked absent but a WORK event was still booked for them.
 */
export type ChildAbsentWorkBookedFlag = {
  kind: "CHILD_ABSENT_BUT_WORK_BOOKED";
  date: string;
  childId: string;
  childName: string;
  workEventId: string;
  workUserId: string;
  workUserName: string;
  workStart: string | null;
  workEnd: string | null;
  absenceNote: string | null;
};

/**
 * Krankheit (info): child is absent, no WORK conflict — informational only.
 */
export type ChildAbsentInfoFlag = {
  kind: "CHILD_ABSENT_INFO";
  date: string;
  childId: string;
  childName: string;
  absenceNote: string | null;
};

/**
 * Krankheit: a ChildVertretung points at a substitute who is themselves SICK
 * on that date — the substitute can't actually cover the slot.
 */
export type SubstituteAlsoSickFlag = {
  kind: "SUBSTITUTE_ALSO_SICK";
  date: string;
  childId: string;
  childName: string;
  substituteUserId: string;
  substituteName: string;
};

/**
 * Weiterer Fall: a Schedule block exists on a weekday but no SB is on it for
 * that date (no ChildAssignment + no covering ChildVertretung). School-holiday
 * dates are excluded by the facade.
 */
export type ScheduleBlockUnassignedFlag = {
  kind: "SCHEDULE_BLOCK_UNASSIGNED";
  date: string;
  childId: string;
  childName: string;
  startTime: string;
  endTime: string;
};

/**
 * Weiterer Fall: total daily WORK minutes booked for a child noticeably exceed
 * the scheduled minutes for that weekday (tolerance: 30 min/day).
 */
export type BookedHoursOverScheduleFlag = {
  kind: "BOOKED_HOURS_OVER_SCHEDULE";
  date: string;
  childId: string;
  childName: string;
  /** Summed WORK minutes for this (child, date) across all SBs. */
  bookedMinutes: number;
  /** Summed Schedule minutes for the child's weekday. */
  scheduledMinutes: number;
};

/**
 * Weiterer Fall: child is missing the Schweigepflichtsentbindung (boolean is
 * still `false`). Static admin task — not date-bound. Surfaced once per child.
 */
export type MissingSchweigepflichtFlag = {
  kind: "MISSING_SCHWEIGEPFLICHT";
  childId: string;
  childName: string;
};
