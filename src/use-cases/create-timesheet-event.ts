/**
 * Use case: Create a timesheet event (Eintrag).
 *
 * Coordinates two feature facades:
 *  1. ChildrenFacade — validates child access/existence (children domain):
 *     - assertChildrenAccessForUser: the user may log WORK for the requested
 *       children on the given date (regular assignment OR Vertretung).
 *     - assertChildExists: the child referenced by an INDIRECT entry exists.
 *  2. TimesheetFacade.createEvent — performs the actual event creation.
 *
 * The cross-feature validation lives here rather than inside either facade
 * because per AGENTS.md, facades must stay within their own domain. Only
 * use cases (and actions/pages) may coordinate across feature boundaries.
 */

import { ChildrenFacade } from "@/features/children/facade";
import { TimesheetFacade } from "@/features/timesheet/facade";
import type { CreateEventInput } from "@/features/timesheet/schemas";
import { parseIsoDate } from "@/lib/dates";

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
    const date = parseIsoDate(input.date);
    await ChildrenFacade.assertChildrenAccessForUser(
      userId,
      input.childIds,
      date,
    );
  }

  // INDIRECT entries reference a single child that must exist.
  if (input.type === "INDIRECT") {
    const childId = input.childIds[0];
    if (childId) await ChildrenFacade.assertChildExists(childId);
  }

  return TimesheetFacade.createEvent(userId, input);
}
