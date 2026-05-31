/**
 * Use case: Create a timesheet event (Eintrag).
 *
 * Coordinates two feature facades:
 *  1. ChildrenFacade.assertChildrenAccessForUser — validates that the user is
 *     allowed to log work for the requested children on the given date
 *     (regular assignment OR Vertretung).
 *  2. TimesheetFacade.createEvent — performs the actual event creation.
 *
 * The cross-feature validation lives here rather than inside either facade
 * because per AGENTS.md, facades must stay within their own domain. Only
 * use cases (and actions/pages) may coordinate across feature boundaries.
 */

import { ChildrenFacade } from "@/features/children/facade";
import { TimesheetFacade } from "@/features/timesheet/facade";
import type { CreateEventInput } from "@/features/timesheet/schemas";

function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export async function createTimesheetEvent(
  userId: string,
  input: CreateEventInput,
) {
  // Validate cross-feature access for WORK events before creating anything.
  if (
    input.type === "WORK" &&
    Array.isArray(input.childIds) &&
    input.childIds.length > 0
  ) {
    const date = parseDateOnly(input.date);
    await ChildrenFacade.assertChildrenAccessForUser(
      userId,
      input.childIds,
      date,
    );
  }

  return TimesheetFacade.createEvent(userId, input);
}
