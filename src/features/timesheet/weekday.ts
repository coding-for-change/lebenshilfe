// Weekday model for Schulbegleiter assignments.
// Monday is the first day (matches our calendars and the DB `weekday`
// column, which stores Mon=0..Sun=6).

export const WEEKDAYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export type AssignmentsByWeekday = Record<Weekday, string[]>;

export function emptyAssignmentsByWeekday(): AssignmentsByWeekday {
  return { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
}

export function weekdayKeyFromDate(date: Date): Weekday {
  return WEEKDAYS[(date.getUTCDay() + 6) % 7];
}

export function childIdsForDate(
  assignments: AssignmentsByWeekday,
  date: Date,
): string[] {
  return assignments[weekdayKeyFromDate(date)];
}
