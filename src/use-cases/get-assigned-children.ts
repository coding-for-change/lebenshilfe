/**
 * Use case: Get the full list of children assigned to a Schulbegleiter.
 *
 * Coordinates two feature facades:
 *  1. TimesheetFacade.listAssignedChildren — children via recurring weekday
 *     assignments (pure timesheet domain).
 *  2. ChildrenFacade.listVertretungenForUserAsSubstitute — children the user
 *     covers as substitute within the given date window.
 *
 * The merge lives here because TimesheetFacade cannot call ChildrenFacade
 * (facades are single-domain) and the page should not contain merge logic.
 *
 * NOTE: The time window for Vertretung children is a known limitation; a
 * Vertretung outside [substituteFrom, substituteTo] will not appear in the
 * returned list. This is tracked separately for improvement.
 */

import { ChildrenFacade } from "@/features/children/facade";
import { TimesheetFacade } from "@/features/timesheet/facade";

export async function getAssignedChildrenForUser(
  userId: string,
  substituteFrom: Date,
  substituteTo: Date,
): Promise<{ id: string; firstName: string; lastName: string }[]> {
  const [regular, vertretungen] = await Promise.all([
    TimesheetFacade.listAssignedChildren(userId),
    ChildrenFacade.listVertretungenForUserAsSubstitute(
      userId,
      substituteFrom,
      substituteTo,
    ),
  ]);

  const seen = new Set(regular.map((c) => c.id));
  const result: { id: string; firstName: string; lastName: string }[] =
    regular.map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
    }));

  for (const v of vertretungen) {
    if (seen.has(v.childId)) continue;
    seen.add(v.childId);
    result.push({
      id: v.child.id,
      firstName: v.child.firstName,
      lastName: v.child.lastName,
    });
  }

  return result;
}
